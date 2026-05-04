import { z } from "zod";

/**
 * Zod validation schemas for API inputs
 */

// Product schemas
export const ProductCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name too long"),
  description: z.string().max(5000, "Description too long").optional().default(""),
  price: z.number().positive("Price must be positive"),
  image_main: z.string().url("Invalid image URL"),
  category_id: z.string().uuid("Invalid category ID").nullable().optional(),
  active: z.boolean().optional().default(true),
  featured: z.boolean().optional().default(false),
});

export const ProductUpdateSchema = z.object({
  id: z.string().uuid("Invalid product ID"),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  price: z.number().positive().optional(),
  image_main: z.string().url().optional(),
  category_id: z.string().uuid().nullable().optional(),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
  images: z.array(z.string().url()).optional(),
});

export const ProductDeleteSchema = z.object({
  id: z.string().uuid("Invalid product ID"),
});

// Category schemas
export const CategoryCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
});

export const CategoryDeleteSchema = z.object({
  id: z.string().uuid("Invalid category ID"),
});

export const CategoryUpdateSchema = z.object({
  id: z.string().uuid("Invalid category ID"),
  name: z.string().min(1).max(100),
});

// Order schemas
export const OrderStatusUpdateSchema = z.object({
  orderId: z.string().uuid("Invalid order ID"),
  newStatus: z.enum(["pending", "paid", "processing", "completed", "cancelled", "refunded"], {
    errorMap: () => ({ message: "Invalid status value" }),
  }),
  currentStatus: z.enum(["pending", "paid", "processing", "completed", "cancelled", "refunded"]),
});

export const OrderDeleteSchema = z.object({
  orderId: z.string().uuid("Invalid order ID"),
});

/** Admin: create discount code */
export const CouponCreateSchema = z
  .object({
    code: z.string().min(1, "Code is required").max(50, "Code too long"),
    discount_type: z.enum(["percentage", "fixed"]),
    value: z.number().positive("Value must be positive"),
    min_purchase: z.number().min(0).optional().default(0),
    max_discount: z.number().positive().nullable().optional(),
    valid_from: z.string().optional(),
    valid_until: z.string().nullable().optional(),
    usage_limit: z.number().int().positive().nullable().optional(),
    active: z.boolean().optional().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.discount_type === "percentage" && data.value > 100) {
      ctx.addIssue({
        code: "custom",
        message: "Percentage cannot exceed 100",
        path: ["value"],
      });
    }
  });

/** Admin: update discount code (partial) */
export const CouponUpdateSchema = z
  .object({
    code: z.string().min(1).max(50).optional(),
    discount_type: z.enum(["percentage", "fixed"]).optional(),
    value: z.number().positive().optional(),
    min_purchase: z.number().min(0).nullable().optional(),
    max_discount: z.number().positive().nullable().optional(),
    valid_from: z.string().nullable().optional(),
    valid_until: z.string().nullable().optional(),
    usage_limit: z.number().int().positive().nullable().optional(),
    active: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.discount_type === "percentage" && data.value != null && data.value > 100) {
      ctx.addIssue({
        code: "custom",
        message: "Percentage cannot exceed 100",
        path: ["value"],
      });
    }
  });

// Email notification schema
export const OrderNotifySchema = z.object({
  type: z.enum(["admin", "customer", "processing"]),
  orderData: z.object({
    orderId: z.string().uuid(),
    orderNumber: z.string().nullable().optional(),
    customerEmail: z.string().email(),
    customerName: z.string().nullable().optional(),
    phone: z.string(),
    address: z.object({
      line1: z.string(),
      line2: z.string().nullable().optional(),
      city: z.string(),
      state: z.string(),
      postalCode: z.string().nullable().optional(),
    }),
    items: z.array(
      z.object({
        name: z.string(),
        price: z.number().nonnegative(),
        quantity: z.number().int().positive(),
      })
    ),
    total: z.number().nonnegative(),
    notes: z.string().nullable().optional(),
  }),
});

// Helper function to validate and parse request body
export function validateRequest<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: string; details?: z.ZodError } {
  try {
    const result = schema.safeParse(data);
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return {
        success: false,
        error: result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", "),
        details: result.error,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Validation failed",
    };
  }
}

