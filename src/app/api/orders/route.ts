import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { notify } from "@/lib/notify";

// GET /api/orders — my orders
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ orders: [] }, { status: 401 });
  const orders = await db.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: { select: { id: true, name: true, image: true, price: true, qty: true } },
      events: { orderBy: { createdAt: "asc" } },
    },
  });
  return NextResponse.json({
    orders: orders.map((o) => ({
      id: o.id,
      code: o.code,
      status: o.status,
      total: o.total,
      itemsTotal: o.itemsTotal,
      deliveryFee: o.deliveryFee,
      discount: o.discount,
      couponCode: o.couponCode,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      createdAt: o.createdAt,
      items: o.items,
      events: o.events,
    })),
  });
}

// POST /api/orders — place order from cart
// body: { addressId? , address?: {name,phone,pincode,line,city,state}, paymentMethod: "COD"|"UPI", couponCode? }
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ ok: false, error: "NOT_LOGGED_IN" }, { status: 401 });

  try {
    const body = await req.json();
    const paymentMethod = body.paymentMethod === "UPI" ? "UPI" : "COD";

    const cartItems = await db.cartItem.findMany({
      where: { userId: user.id },
      include: { product: { include: { retailer: true } } },
    });
    if (cartItems.length === 0) {
      return NextResponse.json({ ok: false, error: "EMPTY_CART" }, { status: 400 });
    }
    const invalid = cartItems.find((i) => !i.product.active || i.qty > i.product.stock);
    if (invalid) {
      return NextResponse.json({ ok: false, error: "STOCK_CHANGED" }, { status: 400 });
    }

    // Resolve address
    let address = body.address;
    if (body.addressId) {
      const a = await db.address.findFirst({ where: { id: String(body.addressId), userId: user.id } });
      if (a) address = { name: a.name, phone: a.phone, pincode: a.pincode, line: a.line, city: a.city, state: a.state };
    }
    if (!address || !address.name || !address.phone || !address.pincode || !address.line || !address.city) {
      return NextResponse.json({ ok: false, error: "ADDRESS_REQUIRED" }, { status: 400 });
    }

    // Totals
    const itemsTotal = cartItems.reduce((s, i) => s + i.product.price * i.qty, 0);
    const deliveryFee = itemsTotal >= 999 ? 0 : 49;
    let discount = 0;
    let couponCode: string | null = null;
    if (body.couponCode && String(body.couponCode).toUpperCase() === "DEMO10") {
      couponCode = "DEMO10";
      discount = Math.round(itemsTotal * 0.1);
    }
    const total = itemsTotal + deliveryFee - discount;

    // Order code
    const seq = (await db.order.count()) + 1;
    const code = `ORD-2026-${String(1000 + seq)}`;

    const order = await db.order.create({
      data: {
        code,
        userId: user.id,
        addressJson: JSON.stringify(address),
        itemsTotal,
        deliveryFee,
        discount,
        couponCode,
        total,
        paymentMethod,
        paymentStatus: paymentMethod === "UPI" ? "PAID" : "PENDING",
        status: "PLACED",
        items: {
          create: cartItems.map((i) => ({
            productId: i.productId,
            retailerId: i.product.retailerId,
            name: i.product.name,
            image: i.product.images,
            price: i.product.price,
            qty: i.qty,
          })),
        },
        events: { create: { status: "PLACED", note: "Order placed successfully" } },
      },
      include: { items: true },
    });

    // Decrement stock
    for (const i of cartItems) {
      await db.product.update({
        where: { id: i.productId },
        data: { stock: { decrement: i.qty } },
      });
    }

    // Clear cart
    await db.cartItem.deleteMany({ where: { userId: user.id } });

    // Notify every retailer with products in this order (LIVE new order)
    const retailerUserIds = new Set<string>();
    for (const i of cartItems) {
      if (i.product.retailer?.userId) retailerUserIds.add(i.product.retailer.userId);
    }
    for (const rid of retailerUserIds) {
      await notify({
        userId: rid,
        title: "🛒 New Order received!",
        body: `Order ${code} — check your Seller Hub for details.`,
        type: "ORDER",
        link: "/seller/orders",
      });
    }

    // Notify customer
    await notify({
      userId: user.id,
      title: `Order ${code} placed`,
      body: "We have received your order. You will get updates at every step.",
      type: "ORDER",
      link: `/orders/${order.id}`,
    });

    return NextResponse.json({ ok: true, orderId: order.id, code });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "SERVER" }, { status: 500 });
  }
}
