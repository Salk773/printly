// /components/SideCart.tsx
"use client";

import { useCart } from "@/context/CartProvider";
import { useWishlist } from "@/context/WishlistProvider";

export default function SideCart() {
  const {
    items,
    total,
    sideCartOpen,
    toggleSideCart,
    increaseQuantity,
    decreaseQuantity,
    removeItem,
    clearCart,
  } = useCart();

  const { toggleWishlist, isInWishlist } = useWishlist();

  return (
    <div
      className={`fixed inset-0 z-40 flex justify-end ${
        sideCartOpen ? "pointer-events-auto" : "pointer-events-none"
      }`}
      aria-hidden={!sideCartOpen}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
          sideCartOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={toggleSideCart}
      />

      {/* Panel */}
      <aside
        className={`relative z-50 h-full w-full max-w-md transform bg-slate-950/90 backdrop-blur-xl border-l border-slate-800 p-4 shadow-2xl transition-transform duration-300 ease-out ${
          sideCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-50">
              Your Cart
            </h2>
            <p className="text-xs text-slate-400">
              Review items before checkout
            </p>
          </div>

          <button
            onClick={toggleSideCart}
            className="rounded-full bg-slate-900/80 px-3 py-1 text-xs text-slate-300 hover:bg-slate-800 transition"
          >
            Close
          </button>
        </div>

        {/* Empty state */}
        {items.length === 0 ? (
          <div className="flex h-[70vh] flex-col items-center justify-center text-center text-slate-400">
            <p className="mb-1 text-sm">Your cart is empty</p>
            <p className="text-xs text-slate-500">
              Add a product to see it here.
            </p>
          </div>
        ) : (
          <>
            {/* Items */}
            <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto pr-2">
              {items.map((item) => {
                const inWishlist = isInWishlist(item.id);

                return (
                  <div
                    key={item.id}
                    className="flex gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3 shadow-sm"
                  >
                    {/* Image */}
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-slate-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-50 line-clamp-1">
                          {item.name}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {(item.price * item.quantity).toFixed(2)} AED
                        </p>
                      </div>

                      <div className="mt-1 flex items-center justify-between">
                        {/* Quantity controls */}
                        <div className="inline-flex items-center rounded-full border border-slate-700 bg-slate-950/80 text-slate-100">
                          <button
                            onClick={() => decreaseQuantity(item.id)}
                            className="px-2 py-1 text-xs hover:bg-slate-800 rounded-l-full"
                          >
                            –
                          </button>
                          <span className="px-2 text-xs">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => increaseQuantity(item.id)}
                            className="px-2 py-1 text-xs hover:bg-slate-800 rounded-r-full"
                          >
                            +
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Wishlist toggle */}
                          <button
                            onClick={() => toggleWishlist(item.id)}
                            className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs transition ${
                              inWishlist
                                ? "border-[#c084fc]/80 bg-[#c084fc]/15 text-[#c084fc]"
                                : "border-slate-700 bg-slate-950/80 text-slate-300 hover:border-[#a855f7]/80 hover:text-[#a855f7]"
                            }`}
                            aria-label="Toggle wishlist"
                          >
                            {inWishlist ? "♥" : "♡"}
                          </button>

                          {/* Remove */}
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-[11px] text-slate-400 hover:text-red-400 transition"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="mt-4 border-t border-slate-800 pt-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs text-slate-400">Subtotal</span>
                <span className="text-base font-semibold text-slate-50">
                  {total.toFixed(2)} AED
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={clearCart}
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs text-slate-300 hover:bg-slate-900 transition"
                >
                  Clear cart
                </button>
                <button
                  className="flex-1 rounded-lg bg-gradient-to-r from-[#c084fc] to-[#a855f7] px-3 py-2 text-xs font-medium text-slate-950 shadow-lg shadow-[#a855f7]/30 hover:opacity-95 transition"
                >
                  Checkout
                </button>
              </div>

              <p className="mt-2 text-[10px] text-slate-500">
                Checkout flow not wired yet – we’ll implement it next.
              </p>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
