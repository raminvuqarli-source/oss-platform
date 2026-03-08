import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogBody } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { showErrorToast } from "@/lib/error-handler";
import { SearchInput } from "@/components/search-input";
import {
  Plus,
  DollarSign,
  CreditCard,
  Banknote,
  Loader2,
  Edit,
  XCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import type { FinancialTransaction } from "@shared/schema";

const getCategoryOptions = (t: any) => [
  { value: "room_booking", label: t('services.roomBooking', 'Room Booking') },
  { value: "room_service", label: t('services.roomService', 'Room Service') },
  { value: "housekeeping", label: t('services.housekeeping', 'Housekeeping') },
  { value: "late_checkout", label: t('services.lateCheckout', 'Late Check-out') },
  { value: "damage_charge", label: t('services.damageCharge', 'Damage Charge') },
  { value: "minibar", label: t('services.minibar', 'Minibar') },
  { value: "spa", label: t('services.spa', 'Spa & Wellness') },
  { value: "restaurant", label: t('services.restaurant', 'Restaurant') },
  { value: "laundry", label: t('services.laundry', 'Laundry') },
  { value: "parking", label: t('services.parking', 'Parking') },
  { value: "other", label: t('services.other', 'Other Service') },
];

const getPaymentStatusOptions = (t: any) => [
  { value: "paid", label: t('finance.paid', 'Paid') },
  { value: "unpaid", label: t('finance.unpaid', 'Unpaid') },
  { value: "pending", label: t('finance.pending', 'Pending') },
];

const getPaymentMethodOptions = (t: any) => [
  { value: "cash", label: t('finance.cash', 'Cash') },
  { value: "card", label: t('finance.card', 'Card') },
  { value: "online", label: t('finance.online', 'Online') },
  { value: "room_charge", label: t('finance.roomCharge', 'Room Charge') },
  { value: "other", label: t('services.other', 'Other') },
];

function PaymentStatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
    paid: { variant: "default", icon: CheckCircle },
    unpaid: { variant: "destructive", icon: XCircle },
    pending: { variant: "secondary", icon: Clock },
    voided: { variant: "outline", icon: AlertCircle },
    refunded: { variant: "outline", icon: RefreshCw },
  };
  const { variant, icon: Icon } = config[status] || config.pending;
  return (
    <Badge variant={variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

interface FinancePanelProps {
  isReadOnly?: boolean;
}

export function FinancePanel({ isReadOnly = false }: FinancePanelProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const categoryOptions = getCategoryOptions(t);
  const paymentStatusOptions = getPaymentStatusOptions(t);
  const paymentMethodOptions = getPaymentMethodOptions(t);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<FinancialTransaction | null>(null);
  const [voidingTransaction, setVoidingTransaction] = useState<FinancialTransaction | null>(null);
  const [voidReason, setVoidReason] = useState("");

  const [formData, setFormData] = useState({
    guestId: "",
    roomNumber: "",
    category: "",
    description: "",
    amount: "",
    paymentStatus: "pending",
    paymentMethod: "",
    notes: "",
  });

  const { data: transactions, isLoading } = useQuery<FinancialTransaction[]>({
    queryKey: ["/api/finance/transactions"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/finance/transactions", {
        ...data,
        amount: parseFloat(data.amount),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: t('finance.transactionCreated', 'Transaction Created'), description: t('finance.transactionCreatedDesc', 'The transaction has been recorded.') });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/transactions"] });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      showErrorToast(toast, error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const response = await apiRequest("PATCH", `/api/finance/transactions/${id}`, {
        ...data,
        amount: parseFloat(data.amount),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: t('finance.transactionUpdated', 'Transaction Updated'), description: t('finance.transactionUpdatedDesc', 'The transaction has been updated.') });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/transactions"] });
      setEditingTransaction(null);
      resetForm();
    },
    onError: (error: Error) => {
      showErrorToast(toast, error);
    },
  });

  const voidMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await apiRequest("POST", `/api/finance/transactions/${id}/void`, { reason });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: t('finance.transactionVoided', 'Transaction Voided'), description: t('finance.transactionVoidedDesc', 'The transaction has been voided.') });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/transactions"] });
      setVoidingTransaction(null);
      setVoidReason("");
    },
    onError: (error: Error) => {
      showErrorToast(toast, error);
    },
  });

  const resetForm = () => {
    setFormData({
      guestId: "",
      roomNumber: "",
      category: "",
      description: "",
      amount: "",
      paymentStatus: "pending",
      paymentMethod: "",
      notes: "",
    });
  };

  const openEditDialog = (transaction: FinancialTransaction) => {
    setEditingTransaction(transaction);
    setFormData({
      guestId: transaction.guestId || "",
      roomNumber: transaction.roomNumber || "",
      category: transaction.category,
      description: transaction.description,
      amount: (transaction.amount / 100).toString(),
      paymentStatus: transaction.paymentStatus,
      paymentMethod: transaction.paymentMethod || "",
      notes: transaction.notes || "",
    });
  };

  const handleSubmit = () => {
    if (!formData.category || !formData.description || !formData.amount) {
      toast({ title: t('common.error', 'Error'), description: t('errors.requiredFieldsMissing', 'Please fill in all required fields'), variant: "destructive" });
      return;
    }
    if (editingTransaction) {
      updateMutation.mutate({ id: editingTransaction.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredTransactions = transactions?.filter((t) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      t.description.toLowerCase().includes(searchLower) ||
      t.category.toLowerCase().includes(searchLower) ||
      t.roomNumber?.toLowerCase().includes(searchLower) ||
      t.createdByName.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const TransactionForm = () => (
    <div className="space-y-4">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="roomNumber">{t('common.room', 'Room Number')}</Label>
          <Input
            id="roomNumber"
            placeholder="101"
            value={formData.roomNumber}
            onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
            data-testid="input-room-number"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">{t('finance.category', 'Category')} *</Label>
          <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
            <SelectTrigger data-testid="select-category">
              <SelectValue placeholder={t('finance.selectCategory', 'Select category')} />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">{t('finance.description', 'Description')} *</Label>
        <Input
          id="description"
          placeholder={t('finance.enterDescription', 'Service description')}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          data-testid="input-description"
        />
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="amount">{t('finance.amount', 'Amount')} *</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              className="pl-10"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              data-testid="input-amount"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="paymentStatus">{t('finance.paymentStatus', 'Payment Status')}</Label>
          <Select value={formData.paymentStatus} onValueChange={(v) => setFormData({ ...formData, paymentStatus: v })}>
            <SelectTrigger data-testid="select-payment-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {paymentStatusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="paymentMethod">{t('finance.paymentMethod', 'Payment Method')}</Label>
          <Select value={formData.paymentMethod} onValueChange={(v) => setFormData({ ...formData, paymentMethod: v })}>
            <SelectTrigger data-testid="select-payment-method">
              <SelectValue placeholder={t('finance.selectMethod', 'Select method')} />
            </SelectTrigger>
            <SelectContent>
              {paymentMethodOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">{t('requests.notes', 'Notes')}</Label>
        <Textarea
          id="notes"
          placeholder={t('finance.additionalNotes', 'Additional notes...')}
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          data-testid="input-notes"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder={t('dashboard.reception.searchTransactions', 'Search transactions...')}
          data-testid="input-search-transactions"
        />
        {!isReadOnly && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="button-add-transaction">
                <Plus className="h-4 w-4" />
                {t('finance.addTransaction', 'Add Transaction')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>{t('finance.addTransaction', 'New Transaction')}</DialogTitle>
                <DialogDescription>{t('finance.createTransactionDesc', 'Create a new financial transaction record.')}</DialogDescription>
              </DialogHeader>
              <DialogBody>
                <TransactionForm />
              </DialogBody>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>{t('common.cancel', 'Cancel')}</Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={createMutation.isPending}
                  data-testid="button-submit-transaction"
                >
                  {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {t('finance.createTransaction', 'Create Transaction')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <ScrollArea className="h-[600px]">
        <div className="space-y-3">
          {filteredTransactions && filteredTransactions.length > 0 ? (
            filteredTransactions.map((transaction) => (
              <Card key={transaction.id} className={transaction.paymentStatus === "voided" ? "opacity-60" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <span className="capitalize">{transaction.category.replace("_", " ")}</span>
                        {transaction.roomNumber && (
                          <Badge variant="outline">{t('common.room', 'Room')} {transaction.roomNumber}</Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">{transaction.description}</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-primary">
                        ${(transaction.amount / 100).toFixed(2)}
                      </div>
                      <PaymentStatusBadge status={transaction.paymentStatus} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      {transaction.paymentMethod && (
                        <span className="flex items-center gap-1">
                          {transaction.paymentMethod === "cash" ? <Banknote className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                          {transaction.paymentMethod.charAt(0).toUpperCase() + transaction.paymentMethod.slice(1)}
                        </span>
                      )}
                      <span>{t('finance.createdBy', 'By')}: {transaction.createdByName}</span>
                      <span>{transaction.createdAt && new Date(transaction.createdAt).toLocaleDateString()}</span>
                    </div>
                    {!isReadOnly && transaction.paymentStatus !== "voided" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(transaction)}
                          data-testid={`button-edit-${transaction.id}`}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          {t('common.edit', 'Edit')}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setVoidingTransaction(transaction)}
                          data-testid={`button-void-${transaction.id}`}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          {t('finance.void', 'Void')}
                        </Button>
                      </div>
                    )}
                  </div>
                  {transaction.voidReason && (
                    <div className="mt-2 p-2 bg-destructive/10 rounded text-sm text-destructive">
                      {t('finance.voided', 'Voided')}: {transaction.voidReason}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg">{t('finance.noTransactions', 'No Transactions')}</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? t('finance.noTransactionsMatch', 'No transactions match your search') : t('finance.noTransactionsYet', 'No transactions recorded yet')}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>

      <Dialog open={!!editingTransaction} onOpenChange={(open) => !open && setEditingTransaction(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('finance.editTransaction', 'Edit Transaction')}</DialogTitle>
            <DialogDescription>{t('finance.editTransactionDesc', 'Update the transaction details.')}</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <TransactionForm />
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTransaction(null)}>{t('common.cancel', 'Cancel')}</Button>
            <Button 
              onClick={handleSubmit} 
              disabled={updateMutation.isPending}
              data-testid="button-update-transaction"
            >
              {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('finance.updateTransaction', 'Update Transaction')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!voidingTransaction} onOpenChange={(open) => !open && setVoidingTransaction(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('finance.voidTransaction', 'Void Transaction')}</DialogTitle>
            <DialogDescription>
              {t('finance.voidTransactionDesc', 'This action cannot be undone. Please provide a reason for voiding this transaction.')}
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-medium">{voidingTransaction?.description}</p>
              <p className="text-sm text-muted-foreground">{t('finance.amount', 'Amount')}: ${voidingTransaction && (voidingTransaction.amount / 100).toFixed(2)}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="voidReason">{t('finance.reason', 'Reason')} *</Label>
              <Textarea
                id="voidReason"
                placeholder={t('finance.enterVoidReason', 'Enter reason for voiding...')}
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                data-testid="input-void-reason"
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVoidingTransaction(null)}>{t('common.cancel', 'Cancel')}</Button>
            <Button 
              variant="destructive"
              onClick={() => voidingTransaction && voidMutation.mutate({ id: voidingTransaction.id, reason: voidReason })}
              disabled={!voidReason || voidMutation.isPending}
              data-testid="button-confirm-void"
            >
              {voidMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('finance.voidTransaction', 'Void Transaction')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
