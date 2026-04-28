import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Helmet } from "react-helmet-async";
import { useToast } from "@/hooks/use-toast";
import {
  ChefHat, UtensilsCrossed, Plus, Edit2, Trash2,
  TrendingUp, DollarSign, ShoppingBag, Clock, CheckCircle2, CreditCard
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Category = { id: string; name: string; sortOrder: number; isActive: boolean };
type MenuItem = { id: string; name: string; description: string | null; priceCents: number; categoryId: string | null; isAvailable: boolean };
type PosOrder = {
  id: string; tableNumber: string | null; guestName: string | null;
  notes: string | null; totalCents: number; kitchenStatus: string;
  settlementStatus: string; createdAt: string; bookingId: string | null;
};
type Analytics = {
  today: { orderCount: number; revenueCents: number };
  activeOrders: { pending: number; cooking: number; ready: number; delivered: number };
  pendingSettlement: number;
};

export default function RestaurantManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [showSettleDialog, setShowSettleDialog] = useState<PosOrder | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: "", sortOrder: "0" });
  const [itemForm, setItemForm] = useState({ name: "", description: "", priceCents: "", categoryId: "" });
  const [settleType, setSettleType] = useState("cash");

  const { data: menu } = useQuery<{ categories: Category[]; items: MenuItem[] }>({
    queryKey: ["/api/restaurant/menu"],
  });
  const { data: orders = [] } = useQuery<PosOrder[]>({
    queryKey: ["/api/restaurant/orders"],
    refetchInterval: 15000,
  });
  const { data: analytics } = useQuery<Analytics>({
    queryKey: ["/api/restaurant/analytics"],
    refetchInterval: 30000,
  });

  const categories = menu?.categories || [];
  const items = menu?.items || [];

  const createCategory = useMutation({
    mutationFn: (data: object) => apiRequest("POST", "/api/restaurant/menu/categories", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant/menu"] });
      setShowCategoryDialog(false);
      setCategoryForm({ name: "", sortOrder: "0" });
      toast({ title: "Category created" });
    },
    onError: () => toast({ title: "Failed to create category", variant: "destructive" }),
  });

  const updateCategory = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) =>
      apiRequest("PATCH", `/api/restaurant/menu/categories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant/menu"] });
      setShowCategoryDialog(false);
      setEditingCategory(null);
      toast({ title: "Category updated" });
    },
    onError: () => toast({ title: "Failed to update category", variant: "destructive" }),
  });

  const deleteCategory = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/restaurant/menu/categories/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant/menu"] });
      toast({ title: "Category deleted" });
    },
  });

  const createItem = useMutation({
    mutationFn: (data: object) => apiRequest("POST", "/api/restaurant/menu/items", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant/menu"] });
      setShowItemDialog(false);
      setItemForm({ name: "", description: "", priceCents: "", categoryId: "" });
      toast({ title: "Menu item created" });
    },
    onError: () => toast({ title: "Failed to create item", variant: "destructive" }),
  });

  const updateItem = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) =>
      apiRequest("PATCH", `/api/restaurant/menu/items/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant/menu"] });
      setShowItemDialog(false);
      setEditingItem(null);
      toast({ title: "Item updated" });
    },
    onError: () => toast({ title: "Failed to update item", variant: "destructive" }),
  });

  const deleteItem = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/restaurant/menu/items/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant/menu"] });
      toast({ title: "Item deleted" });
    },
  });

  const settleOrder = useMutation({
    mutationFn: ({ id, paymentType }: { id: string; paymentType: string }) =>
      apiRequest("POST", `/api/restaurant/orders/${id}/settle`, { paymentType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant/analytics"] });
      setShowSettleDialog(null);
      toast({ title: "Order settled successfully" });
    },
    onError: () => toast({ title: "Failed to settle order", variant: "destructive" }),
  });

  const pendingSettlementOrders = orders.filter(
    o => o.kitchenStatus === "delivered" && o.settlementStatus === "pending"
  );
  const activeOrders = orders.filter(o => o.kitchenStatus !== "delivered");

  function openCategoryEdit(cat: Category) {
    setEditingCategory(cat);
    setCategoryForm({ name: cat.name, sortOrder: String(cat.sortOrder) });
    setShowCategoryDialog(true);
  }

  function openItemEdit(item: MenuItem) {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      description: item.description || "",
      priceCents: String(item.priceCents),
      categoryId: item.categoryId || "",
    });
    setShowItemDialog(true);
  }

  function handleCategorySubmit() {
    const payload = { name: categoryForm.name, sortOrder: Number(categoryForm.sortOrder) };
    if (editingCategory) {
      updateCategory.mutate({ id: editingCategory.id, data: payload });
    } else {
      createCategory.mutate(payload);
    }
  }

  function handleItemSubmit() {
    const payload = {
      name: itemForm.name,
      description: itemForm.description || null,
      priceCents: Number(itemForm.priceCents),
      categoryId: itemForm.categoryId || null,
    };
    if (editingItem) {
      updateItem.mutate({ id: editingItem.id, data: payload });
    } else {
      createItem.mutate(payload);
    }
  }

  const statusColor: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    cooking: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    ready: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
    delivered: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
  };

  return (
    <>
      <Helmet>
        <title>Restaurant Manager | O.S.S</title>
      </Helmet>
      <div className="p-4 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <UtensilsCrossed className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Restaurant Manager</h1>
            <p className="text-sm text-muted-foreground">Menu, orders, and settlement</p>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card data-testid="card-today-orders">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Today's Orders</span>
              </div>
              <p className="text-2xl font-bold mt-1" data-testid="text-today-orders">{analytics?.today.orderCount ?? 0}</p>
            </CardContent>
          </Card>
          <Card data-testid="card-today-revenue">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                <span className="text-sm text-muted-foreground">Today's Revenue</span>
              </div>
              <p className="text-2xl font-bold mt-1 text-emerald-600" data-testid="text-today-revenue">
                ${((analytics?.today.revenueCents ?? 0) / 100).toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card data-testid="card-active-orders">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-muted-foreground">Active</span>
              </div>
              <p className="text-2xl font-bold mt-1" data-testid="text-active-orders">{activeOrders.length}</p>
            </CardContent>
          </Card>
          <Card data-testid="card-pending-settlement">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-rose-600" />
                <span className="text-sm text-muted-foreground">Pending Settlement</span>
              </div>
              <p className="text-2xl font-bold mt-1 text-rose-600" data-testid="text-pending-settlement">
                {analytics?.pendingSettlement ?? pendingSettlementOrders.length}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="orders">
          <TabsList className="w-full md:w-auto" data-testid="tabs-manager">
            <TabsTrigger value="orders" data-testid="tab-manager-orders">
              <ShoppingBag className="h-4 w-4 mr-1" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="settlement" data-testid="tab-manager-settlement">
              <CreditCard className="h-4 w-4 mr-1" />
              Settlement {pendingSettlementOrders.length > 0 && `(${pendingSettlementOrders.length})`}
            </TabsTrigger>
            <TabsTrigger value="menu" data-testid="tab-manager-menu">
              <ChefHat className="h-4 w-4 mr-1" />
              Menu
            </TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders" className="mt-4 space-y-2">
            {activeOrders.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mb-3 opacity-30" />
                <p>No active orders</p>
              </div>
            ) : (
              activeOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border" data-testid={`row-manager-order-${order.id}`}>
                  <div className="flex-1">
                    <p className="font-medium">
                      {order.tableNumber ? `Table ${order.tableNumber}` : order.guestName || `#${order.id.slice(-6).toUpperCase()}`}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">${(order.totalCents / 100).toFixed(2)}</p>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${statusColor[order.kitchenStatus]}`}>
                      {order.kitchenStatus}
                    </span>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* Settlement Tab */}
          <TabsContent value="settlement" className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground">Orders delivered but not yet paid — approve payment method to close them out.</p>
            {pendingSettlementOrders.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mb-3 opacity-30" />
                <p>All orders settled</p>
              </div>
            ) : (
              pendingSettlementOrders.map(order => (
                <Card key={order.id} className="border-2 border-rose-200 dark:border-rose-800" data-testid={`card-settle-order-${order.id}`}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">
                          {order.tableNumber ? `Table ${order.tableNumber}` : order.guestName || `#${order.id.slice(-6).toUpperCase()}`}
                        </p>
                        <p className="text-sm font-medium text-primary mt-1">${(order.totalCents / 100).toFixed(2)}</p>
                        {order.bookingId && <p className="text-xs text-muted-foreground mt-1">Guest booking available</p>}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => { setShowSettleDialog(order); setSettleType(order.bookingId ? "room_charge" : "cash"); }}
                        data-testid={`button-settle-${order.id}`}
                      >
                        <CreditCard className="h-3 w-3 mr-1" />
                        Settle
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Menu Tab */}
          <TabsContent value="menu" className="mt-4">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Categories */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Categories</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setEditingCategory(null); setCategoryForm({ name: "", sortOrder: "0" }); setShowCategoryDialog(true); }}
                    data-testid="button-add-category"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {categories.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`row-category-${cat.id}`}>
                      <span className="font-medium">{cat.name}</span>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openCategoryEdit(cat)} data-testid={`button-edit-cat-${cat.id}`}>
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive"
                          onClick={() => deleteCategory.mutate(cat.id)} data-testid={`button-delete-cat-${cat.id}`}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {categories.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No categories yet</p>}
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Menu Items</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setEditingItem(null); setItemForm({ name: "", description: "", priceCents: "", categoryId: "" }); setShowItemDialog(true); }}
                    data-testid="button-add-item"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`row-item-${item.id}`}>
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">${(item.priceCents / 100).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {!item.isAvailable && <Badge variant="secondary">Unavailable</Badge>}
                        <Button size="sm" variant="ghost" onClick={() => openItemEdit(item)} data-testid={`button-edit-item-${item.id}`}>
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive"
                          onClick={() => deleteItem.mutate(item.id)} data-testid={`button-delete-item-${item.id}`}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No menu items yet</p>}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent data-testid="dialog-category">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cat-name">Name</Label>
              <Input id="cat-name" value={categoryForm.name} onChange={e => setCategoryForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Starters" data-testid="input-category-name" />
            </div>
            <div>
              <Label htmlFor="cat-order">Sort Order</Label>
              <Input id="cat-order" type="number" value={categoryForm.sortOrder}
                onChange={e => setCategoryForm(f => ({ ...f, sortOrder: e.target.value }))}
                data-testid="input-category-order" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>Cancel</Button>
            <Button onClick={handleCategorySubmit} disabled={createCategory.isPending || updateCategory.isPending}
              data-testid="button-save-category">
              {editingCategory ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Item Dialog */}
      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent data-testid="dialog-item">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Menu Item" : "Add Menu Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="item-name">Name</Label>
              <Input id="item-name" value={itemForm.name} onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Caesar Salad" data-testid="input-item-name" />
            </div>
            <div>
              <Label htmlFor="item-desc">Description</Label>
              <Input id="item-desc" value={itemForm.description} onChange={e => setItemForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Optional" data-testid="input-item-description" />
            </div>
            <div>
              <Label htmlFor="item-price">Price (in cents)</Label>
              <Input id="item-price" type="number" value={itemForm.priceCents}
                onChange={e => setItemForm(f => ({ ...f, priceCents: e.target.value }))}
                placeholder="e.g. 1500 = $15.00" data-testid="input-item-price" />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={itemForm.categoryId} onValueChange={v => setItemForm(f => ({ ...f, categoryId: v }))}>
                <SelectTrigger data-testid="select-item-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowItemDialog(false)}>Cancel</Button>
            <Button onClick={handleItemSubmit} disabled={createItem.isPending || updateItem.isPending}
              data-testid="button-save-item">
              {editingItem ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settle Dialog */}
      <Dialog open={!!showSettleDialog} onOpenChange={() => setShowSettleDialog(null)}>
        <DialogContent data-testid="dialog-settle">
          <DialogHeader>
            <DialogTitle>Settle Order</DialogTitle>
          </DialogHeader>
          {showSettleDialog && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">
                  {showSettleDialog.tableNumber ? `Table ${showSettleDialog.tableNumber}` : showSettleDialog.guestName || `Order #${showSettleDialog.id.slice(-6).toUpperCase()}`}
                </p>
                <p className="text-xl font-bold text-primary mt-1">${(showSettleDialog.totalCents / 100).toFixed(2)}</p>
              </div>
              <div>
                <Label>Payment Method</Label>
                <Select value={settleType} onValueChange={setSettleType}>
                  <SelectTrigger data-testid="select-payment-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    {showSettleDialog.bookingId && <SelectItem value="room_charge">Room Charge (Folio)</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettleDialog(null)}>Cancel</Button>
            <Button
              onClick={() => showSettleDialog && settleOrder.mutate({ id: showSettleDialog.id, paymentType: settleType })}
              disabled={settleOrder.isPending}
              data-testid="button-confirm-settle"
            >
              Confirm Settlement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
