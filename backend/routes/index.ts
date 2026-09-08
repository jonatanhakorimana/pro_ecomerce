import { Router } from "express";
import { authRouter } from "./auth.routes.ts";
import { productsRouter } from "./products.routes.ts";
import { categoriesRouter } from "./categories.routes.ts";
import { cartRouter } from "./cart.routes.ts";
import { ordersRouter } from "./orders.routes.ts";
import { couponsRouter } from "./coupons.routes.ts";
import { adminRouter } from "./admin.routes.ts";
import { systemRouter } from "./system.routes.ts";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/products", productsRouter);
apiRouter.use("/categories", categoriesRouter);
apiRouter.use("/cart", cartRouter);
apiRouter.use("/orders", ordersRouter);
apiRouter.use("/coupons", couponsRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/system", systemRouter);
apiRouter.use("/", systemRouter); // For /api/health
