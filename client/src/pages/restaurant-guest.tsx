import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Helmet } from "react-helmet-async";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "wouter";
import { Utensils, MessageSquare, ShoppingCart, Plus, Minus, CheckCircle2, Loader2, Bell } from "lucide-react";

type Category = { id: string; name: string; sortOrder: number; isActive: boolean };
type MenuItem = { id: string; name: string; description: string | null; priceCents: number; categoryId: string | null; isAvailable: boolean };
type CartItem = MenuItem & { quantity: number };

const fmt = (cents: number) => `₼${(cents / 100).toFixed(2)}`;

export default function RestaurantGuestPage() {
  const { t } = useTranslation();
  const { propertyId, tableNumber } = useParams<{ propertyId: string; tableNumber: string }>();
  const { toast } = useToast();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [guestName, setGuestName] = useState("");
  const [notes, setNotes] = useState("");
  const [showCart, setShowCart] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [msgText, setMsgText] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const { data: menu, isLoading } = useQuery<{ categories: Category[]; items: MenuItem[] }>({
    queryKey: [`/api/public/restaurant/${propertyId}/menu`],
    retry: 2,
  });

  const placeOrder = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/public/restaurant/${propertyId}/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableNumber,
          guestName: guestName || t("restLanding.guestPageTitle"),
          notes: notes || null,
          items: cart.map(ci => ({
            itemName: ci.name,
            quantity: ci.quantity,
            unitPriceCents: ci.priceCents,
          })),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      setOrderSuccess(true);
      setCart([]);
      setShowCart(false);
      toast({ title: t("restLanding.guestOrderPlaced") });
    },
    onError: () => toast({ title: "Xəta baş verdi", variant: "destructive" }),
  });

  const sendMessage = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/public/restaurant/${propertyId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableNumber, senderName: guestName || "Qonaq", message: msgText }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      setMsgText("");
      setShowMessage(false);
      toast({ title: t("restLanding.guestMessageSent") });
    },
    onError: () => toast({ title: "Xəta baş verdi", variant: "destructive" }),
  });

  const callWaiter = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/public/restaurant/${propertyId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableNumber, senderName: guestName || "Qonaq", message: "🔔 Qaroson çağırılır" }),
      });
      return res.json();
    },
    onSuccess: () => toast({ title: t("restLanding.guestCallWaiter") }),
  });

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const ex = prev.find(c => c.id === item.id);
      if (ex) return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => {
      const ex = prev.find(c => c.id === id);
      if (!ex) return prev;
      if (ex.quantity === 1) return prev.filter(c => c.id !== id);
      return prev.map(c => c.id === id ? { ...c, quantity: c.quantity - 1 } : c);
    });
  };

  const categories = menu?.categories?.filter(c => c.isActive) || [];
  const allItems = menu?.items?.filter(i => i.isAvailable) || [];
  const filteredItems = selectedCategoryId
    ? allItems.filter(i => i.categoryId === selectedCategoryId)
    : allItems;

  const cartTotal = cart.reduce((s, c) => s + c.priceCents * c.quantity, 0);
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);

  if (!propertyId || !tableNumber) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8">
          <Utensils className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Keçərsiz QR kodu</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{t("restLanding.guestPageTitle")} | O.S.S</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Helmet>
      <div className="min-h-screen bg-background" data-testid="restaurant-guest-page">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
          <div className="px-4 py-3 flex items-center justify-between max-w-2xl mx-auto">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary rounded-lg">
                <Utensils className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <p className="font-bold text-sm leading-none">{t("restLanding.guestPageTitle")}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t("restaurant.table")} {tableNumber}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowMessage(true)} data-testid="btn-guest-message" className="h-8">
                <MessageSquare className="h-3.5 w-3.5 mr-1" />
                <span className="text-xs">{t("restLanding.guestSendMessage")}</span>
              </Button>
              <Button size="sm" variant="outline" onClick={() => callWaiter.mutate()} disabled={callWaiter.isPending} data-testid="btn-guest-call-waiter" className="h-8">
                <Bell className="h-3.5 w-3.5 mr-1" />
                <span className="text-xs">{t("restLanding.guestCallWaiter")}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Order success banner */}
        {orderSuccess && (
          <div className="mx-4 mt-4 p-3 rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 flex items-center gap-2" data-testid="banner-order-success">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">{t("restLanding.guestOrderPlaced")}</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">{t("restLanding.guestWaiterWillConfirm")}</p>
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="max-w-2xl mx-auto px-4 pb-32">
          {/* Guest name input */}
          <div className="mt-4 mb-4">
            <Label className="text-xs text-muted-foreground">Adınız (istəyə görə)</Label>
            <Input
              value={guestName}
              onChange={e => setGuestName(e.target.value)}
              placeholder="Adınızı daxil edin"
              className="mt-1 h-9"
              data-testid="input-guest-name"
            />
          </div>

          {/* Category filter */}
          {categories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
              <Button
                size="sm"
                variant={selectedCategoryId === null ? "default" : "outline"}
                className="shrink-0 h-7 text-xs"
                onClick={() => setSelectedCategoryId(null)}
              >
                Hamısı
              </Button>
              {categories.sort((a, b) => a.sortOrder - b.sortOrder).map(cat => (
                <Button
                  key={cat.id}
                  size="sm"
                  variant={selectedCategoryId === cat.id ? "default" : "outline"}
                  className="shrink-0 h-7 text-xs"
                  onClick={() => setSelectedCategoryId(cat.id)}
                  data-testid={`cat-filter-${cat.id}`}
                >
                  {cat.name}
                </Button>
              ))}
            </div>
          )}

          {/* Menu items */}
          {isLoading ? (
            <div className="grid grid-cols-1 gap-3">
              {[1,2,3,4].map(i => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-muted-foreground">
              <Utensils className="h-12 w-12 mb-3 opacity-30" />
              <p>Menyu hələ əlavə edilməyib</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredItems.map(item => {
                const inCart = cart.find(c => c.id === item.id);
                return (
                  <Card key={item.id} className="overflow-hidden" data-testid={`menu-item-${item.id}`}>
                    <CardContent className="p-3 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{item.name}</p>
                        {item.description && <p className="text-xs text-muted-foreground truncate">{item.description}</p>}
                        <p className="text-sm font-bold text-primary mt-0.5">{fmt(item.priceCents)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {inCart ? (
                          <div className="flex items-center gap-2">
                            <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => removeFromCart(item.id)} data-testid={`btn-remove-${item.id}`}>
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="font-bold text-sm w-4 text-center">{inCart.quantity}</span>
                            <Button size="icon" className="h-7 w-7" onClick={() => addToCart(item)} data-testid={`btn-add-${item.id}`}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button size="sm" onClick={() => addToCart(item)} data-testid={`btn-add-${item.id}`} className="h-8">
                            <Plus className="h-3.5 w-3.5 mr-1" />Əlavə et
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Floating cart button */}
        {cartCount > 0 && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t shadow-lg">
            <Button
              className="w-full max-w-2xl mx-auto flex items-center justify-between h-12 text-base font-bold"
              onClick={() => setShowCart(true)}
              data-testid="btn-view-cart"
            >
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                <span>{cartCount} məhsul</span>
              </div>
              <span>{fmt(cartTotal)}</span>
            </Button>
          </div>
        )}

        {/* Cart Dialog */}
        <Dialog open={showCart} onOpenChange={setShowCart}>
          <DialogContent className="max-w-md" data-testid="dialog-cart">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Sifarişiniz
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {cart.map(item => (
                <div key={item.id} className="flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{fmt(item.priceCents)} × {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => removeFromCart(item.id)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-sm font-bold">{item.quantity}</span>
                    <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => addToCart(item)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <span className="text-sm font-bold w-16 text-right">{fmt(item.priceCents * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-3">
              <div className="space-y-2 mb-3">
                <Label className="text-xs">Qeyd (istəyə görə)</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Xüsusi istəklər..." className="text-sm" data-testid="input-order-notes" />
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold">Cəmi:</span>
                <span className="text-xl font-bold text-primary">{fmt(cartTotal)}</span>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCart(false)}>Geri</Button>
              <Button
                onClick={() => placeOrder.mutate()}
                disabled={placeOrder.isPending || cart.length === 0}
                className="flex-1"
                data-testid="btn-place-order"
              >
                {placeOrder.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Sifariş Ver
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Message Dialog */}
        <Dialog open={showMessage} onOpenChange={setShowMessage}>
          <DialogContent className="max-w-sm" data-testid="dialog-message">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                {t("restLanding.guestSendMessage")}
              </DialogTitle>
            </DialogHeader>
            <Textarea
              value={msgText}
              onChange={e => setMsgText(e.target.value)}
              rows={3}
              placeholder="Qarosona mesaj yazın..."
              data-testid="input-guest-message"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowMessage(false)}>Ləğv et</Button>
              <Button onClick={() => sendMessage.mutate()} disabled={sendMessage.isPending || !msgText.trim()} data-testid="btn-send-message">
                {sendMessage.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {t("restLanding.guestSendMessage")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
