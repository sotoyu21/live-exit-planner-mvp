export const paymentConfig = {
  // "test" = 料金は発生しない価格反応テスト
  // "live" = Stripe Payment Linkへ移動する実課金
  // Server verification is not deployed. Do not enable live checkout.
  mode: "disabled",
  livePrice: 200,
  paymentUrl: "https://buy.stripe.com/00w4gr591b6ke4o8v0bMQ00",
  successUrl: "https://sotoyu21.github.io/live-exit-planner-mvp/success.html"
};
