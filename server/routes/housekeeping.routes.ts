import type { Express } from "express";
import { storage } from "../storage";
import { asString } from "../utils/request";
import { requireAuth, requireRole } from "../middleware";
import { logger } from "../utils/logger";

const VALID_TASK_TYPES = ["cleaning", "inspection", "maintenance"];
const VALID_CLEANING_TYPES = ["checkout_cleaning", "stayover_cleaning", "deep_cleaning"];
const VALID_STATUSES = ["pending", "assigned", "in_progress", "inspection", "completed", "cancelled"];
const VALID_PRIORITIES = ["low", "normal", "high", "urgent"];

export function registerHousekeepingRoutes(app: Express): void {
  app.get("/api/housekeeping/tasks", requireRole("admin", "reception", "owner_admin", "property_manager", "staff"), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      if (!user.propertyId) {
        return res.json([]);
      }

      const tenantId = req.tenantId;
      if (!tenantId) return res.status(403).json({ message: "Tenant context required" });

      let tasks;
      if (tenantId.startsWith("demo_session_")) {
        const allTasks = await storage.getHousekeepingTasksByProperty(user.propertyId, tenantId);
        const fallbackTasks = await storage.getHousekeepingTasksByProperty(user.propertyId, user.tenantId || "");
        const taskIds = new Set(allTasks.map(t => t.id));
        tasks = [...allTasks, ...fallbackTasks.filter(t => !taskIds.has(t.id))];
      } else {
        tasks = await storage.getHousekeepingTasksByProperty(user.propertyId, tenantId);
      }

      res.json(tasks);
    } catch (error) {
      logger.error({ err: error }, "Error fetching housekeeping tasks");
      res.status(500).json({ message: "Failed to fetch housekeeping tasks" });
    }
  });

  app.get("/api/housekeeping/my-tasks", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const tasks = await storage.getHousekeepingTasksByStaff(userId);

      if (user.propertyId) {
        const filtered = tasks.filter(t => t.propertyId === user.propertyId);
        return res.json(filtered);
      }

      res.json(tasks);
    } catch (error) {
      logger.error({ err: error }, "Error fetching my housekeeping tasks");
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.patch("/api/housekeeping/tasks/:id", requireRole("admin", "reception", "owner_admin", "property_manager", "staff"), async (req, res) => {
    try {
      const taskId = asString(req.params.id);
      const { status, assignedTo, notes, priority } = req.body;
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const task = await storage.getHousekeepingTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      if (user.propertyId && task.propertyId !== user.propertyId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (req.tenantId && !req.tenantId.startsWith("demo_session_") && task.tenantId !== req.tenantId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const updates: Record<string, any> = {};

      if (status) {
        if (!VALID_STATUSES.includes(status)) {
          return res.status(400).json({ message: `Invalid status. Allowed: ${VALID_STATUSES.join(", ")}` });
        }
        updates.status = status;
        if (status === "completed") {
          updates.completedAt = new Date();
        }
      }

      if (assignedTo !== undefined) {
        if (assignedTo !== null) {
          const assignee = await storage.getUser(assignedTo);
          if (!assignee || assignee.role !== "staff") {
            return res.status(400).json({ message: "assignedTo must be a valid staff user" });
          }
          if (assignee.propertyId && assignee.propertyId !== task.propertyId) {
            return res.status(400).json({ message: "Staff must belong to the same property" });
          }
        }
        updates.assignedTo = assignedTo;
        if (assignedTo && !updates.status) {
          updates.status = "assigned";
        }
      }

      if (notes !== undefined) updates.notes = notes;
      if (priority) {
        if (!VALID_PRIORITIES.includes(priority)) {
          return res.status(400).json({ message: `Invalid priority. Allowed: ${VALID_PRIORITIES.join(", ")}` });
        }
        updates.priority = priority;
      }

      const updated = await storage.updateHousekeepingTask(taskId, updates);

      if (status === "completed" && updated) {
        const unit = await storage.getUnit(updated.unitId);
        if (unit) {
          await storage.updateUnit(unit.id, { status: "ready" });
          logger.info({ unitNumber: unit.unitNumber }, "Housekeeping complete, room set to ready");
        }
      }

      res.json(updated);
    } catch (error) {
      logger.error({ err: error }, "Error updating housekeeping task");
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.post("/api/housekeeping/tasks", requireRole("admin", "reception", "owner_admin", "property_manager"), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const { unitId, taskType, cleaningType, priority, assignedTo, notes, dueDate } = req.body;

      if (!unitId || !taskType) {
        return res.status(400).json({ message: "unitId and taskType are required" });
      }

      if (!VALID_TASK_TYPES.includes(taskType)) {
        return res.status(400).json({ message: `Invalid taskType. Allowed: ${VALID_TASK_TYPES.join(", ")}` });
      }

      if (cleaningType && !VALID_CLEANING_TYPES.includes(cleaningType)) {
        return res.status(400).json({ message: `Invalid cleaningType. Allowed: ${VALID_CLEANING_TYPES.join(", ")}` });
      }

      if (priority && !VALID_PRIORITIES.includes(priority)) {
        return res.status(400).json({ message: `Invalid priority. Allowed: ${VALID_PRIORITIES.join(", ")}` });
      }

      const unit = await storage.getUnit(unitId);
      if (!unit) {
        return res.status(404).json({ message: "Unit not found" });
      }

      if (user.propertyId && unit.propertyId !== user.propertyId) {
        return res.status(403).json({ message: "Unit does not belong to your property" });
      }

      if (assignedTo) {
        const assignee = await storage.getUser(assignedTo);
        if (!assignee || assignee.role !== "staff") {
          return res.status(400).json({ message: "assignedTo must be a valid staff user" });
        }
        if (assignee.propertyId && assignee.propertyId !== unit.propertyId) {
          return res.status(400).json({ message: "Staff must belong to the same property" });
        }
      }

      const tenantId = req.tenantId || user.tenantId || "";
      const propertyId = user.propertyId || unit.propertyId || "";

      const task = await storage.createHousekeepingTask({
        tenantId,
        propertyId,
        unitId: unit.id,
        roomNumber: unit.unitNumber,
        taskType,
        cleaningType: cleaningType || null,
        status: assignedTo ? "assigned" : "pending",
        priority: priority || "normal",
        assignedTo: assignedTo || null,
        triggerSource: "manual",
        notes: notes || null,
        dueDate: dueDate ? new Date(dueDate) : null,
      });

      if (assignedTo) {
        await storage.createNotification({
          userId: assignedTo,
          tenantId,
          title: "New Cleaning Task",
          message: `Room ${unit.unitNumber} requires ${taskType}`,
          type: "housekeeping",
          read: false,
          actionUrl: "/housekeeping",
        }).catch(err => logger.error({ err }, "Housekeeping notification error"));
      }

      res.status(201).json(task);
    } catch (error) {
      logger.error({ err: error }, "Error creating housekeeping task");
      res.status(500).json({ message: "Failed to create task" });
    }
  });
}
