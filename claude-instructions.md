# Claude Instructions for ShipFast SaaS Boilerplate

## Project Context

You are working on **ShipFast**, a comprehensive Next.js SaaS boilerplate designed to help developers quickly launch their SaaS applications. This project includes authentication, payments, database management, email functionality, and a modern UI framework.

### Technology Stack
- **Frontend**: Next.js 15 with App Router, React 19, Tailwind CSS, DaisyUI
- **Backend**: Next.js API Routes, NextAuth v5 (beta), MongoDB with Mongoose
- **Payments**: Stripe Checkout and Customer Portal
- **Email**: Resend for transactional emails
- **Authentication**: NextAuth with Google OAuth and Email providers
- **Deployment**: Optimized for Vercel deployment

## Core Principles

### 1. Consistency First
- Follow existing patterns in the codebase
- Use the same naming conventions and file structures
- Maintain the established component architecture
- Always check existing implementations before creating new ones

### 2. User Experience Priority
- Implement proper loading states for all async operations
- Provide clear error messages and feedback
- Ensure responsive design across all screen sizes
- Include accessibility features (ARIA labels, semantic HTML)

### 3. Security & Best Practices
- Validate all inputs in API routes
- Use environment variables for sensitive data
- Implement proper error handling with try-catch blocks
- Follow Next.js security best practices

### 4. Performance Optimization
- Use Server Components by default, Client Components only when needed
- Implement proper image optimization with Next.js Image
- Minimize bundle size and optimize database queries
- Use appropriate caching strategies

## File Structure & Organization

```
ship-fast/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── stripe/        # Payment endpoints
│   │   └── webhook/       # Webhook handlers
│   ├── dashboard/         # Protected dashboard pages
│   ├── blog/             # Blog functionality
│   └── (marketing)/      # Marketing pages
├── components/           # Reusable UI components
├── libs/                # Utility libraries and configurations
├── models/              # Database models
├── config.js           # Centralized configuration
├── auth.js            # NextAuth configuration
└── middleware.js      # Next.js middleware
```

## Coding Standards

### Component Development

#### Server Components (Default)
```javascript
// app/example/page.js
import { auth } from "@/libs/auth";
import config from "@/config";

export default async function ExamplePage() {
  const session = await auth();
  
  return (
    <div className="container mx-auto px-4">
      <h1 className="text-3xl font-bold">
        Welcome to {config.appName}
      </h1>
      {session?.user && (
        <p>Hello, {session.user.name}!</p>
      )}
    </div>
  );
}

// Add metadata for SEO
export const metadata = {
  title: "Example Page - ShipFast",
  description: "Example page description",
};
```

#### Client Components
```javascript
// components/ExampleComponent.js
"use client";

import { useState } from "react";
import apiClient from "@/libs/api";
import { toast } from "react-hot-toast";

const ExampleComponent = ({ initialData }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState(initialData);

  const handleAction = async () => {
    setIsLoading(true);
    
    try {
      const response = await apiClient.post("/api/example", { data });
      setData(response.data);
      toast.success("Action completed successfully!");
    } catch (error) {
      console.error("Action failed:", error);
      toast.error(error?.response?.data?.error || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Example Component</h2>
        <div className="card-actions justify-end">
          <button
            className="btn btn-primary"
            onClick={handleAction}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              "Perform Action"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExampleComponent;
```

### API Route Development

#### Standard API Route Pattern
```javascript
// app/api/example/route.js
import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";

export async function POST(req) {
  try {
    // Authentication check (if required)
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();

    // Input validation
    if (!body.requiredField) {
      return NextResponse.json(
        { error: "Required field is missing" },
        { status: 400 }
      );
    }

    // Database connection
    await connectMongo();

    // Business logic
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Perform operations
    const result = await performOperation(body, user);

    // Return success response
    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function
async function performOperation(data, user) {
  // Implementation here
  return { message: "Operation completed" };
}
```

### Database Model Development

#### Mongoose Schema Pattern
```javascript
// models/ExampleModel.js
import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

const exampleSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "pending"],
      default: "pending",
    },
    metadata: {
      type: Map,
      of: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Indexes for performance
exampleSchema.index({ userId: 1, status: 1 });
exampleSchema.index({ createdAt: -1 });

// Virtual fields
exampleSchema.virtual("isActive").get(function() {
  return this.status === "active";
});

// Instance methods
exampleSchema.methods.activate = function() {
  this.status = "active";
  return this.save();
};

// Static methods
exampleSchema.statics.findByUser = function(userId) {
  return this.find({ userId, status: "active" });
};

// Plugins
exampleSchema.plugin(toJSON);

export default mongoose.models.ExampleModel || 
  mongoose.model("ExampleModel", exampleSchema);
```

## Authentication Patterns

### Protecting Pages
```javascript
// app/dashboard/page.js
import { auth } from "@/libs/auth";
import { redirect } from "next/navigation";
import config from "@/config";

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect(config.auth.loginUrl);
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {session.user.name}!</p>
    </div>
  );
}
```

### Middleware for Route Protection
```javascript
// middleware.js
import { auth } from "@/libs/auth";
import { NextResponse } from "next/server";

export async function middleware(request) {
  const session = await auth();
  
  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    if (!session?.user) {
      return NextResponse.redirect(
        new URL("/api/auth/signin", request.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"]
};
```

## Stripe Integration Patterns

### Payment Button Component
```javascript
// components/PaymentButton.js
"use client";

import { useState } from "react";
import apiClient from "@/libs/api";
import config from "@/config";

const PaymentButton = ({ priceId, planName }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    setIsLoading(true);

    try {
      const response = await apiClient.post("/api/stripe/create-checkout", {
        priceId,
        mode: "subscription",
        successUrl: `${window.location.origin}/dashboard?success=true`,
        cancelUrl: `${window.location.origin}/pricing`,
      });

      window.location.href = response.url;
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Payment failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      className="btn btn-primary w-full"
      onClick={handlePayment}
      disabled={isLoading}
    >
      {isLoading ? (
        <span className="loading loading-spinner loading-xs"></span>
      ) : (
        `Get ${planName}`
      )}
    </button>
  );
};

export default PaymentButton;
```

### Webhook Handler
```javascript
// app/api/webhook/stripe/route.js
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req) {
  try {
    const body = await req.text();
    const headersList = headers();
    const signature = headersList.get("stripe-signature");

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return NextResponse.json(
        { error: "Webhook signature verification failed" },
        { status: 400 }
      );
    }

    await connectMongo();

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session) {
  const user = await User.findById(session.client_reference_id);
  if (user) {
    user.customerId = session.customer;
    user.priceId = session.line_items?.data[0]?.price?.id;
    user.hasAccess = true;
    await user.save();
  }
}

async function handleSubscriptionDeleted(subscription) {
  const user = await User.findOne({ customerId: subscription.customer });
  if (user) {
    user.hasAccess = false;
    await user.save();
  }
}
```

## UI/UX Best Practices

### Loading States
```javascript
// Always provide loading feedback
{isLoading ? (
  <div className="flex items-center gap-2">
    <span className="loading loading-spinner loading-sm"></span>
    Processing...
  </div>
) : (
  <span>Submit</span>
)}
```

### Error Handling
```javascript
// Use toast notifications for user feedback
import { toast } from "react-hot-toast";

try {
  await apiCall();
  toast.success("Operation completed successfully!");
} catch (error) {
  toast.error(error?.response?.data?.error || "Something went wrong");
}
```

### Form Patterns
```javascript
// components/ContactForm.js
"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      toast.success("Message sent successfully!");
      setFormData({ name: "", email: "", message: "" });
    } catch (error) {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-control">
        <label className="label">
          <span className="label-text">Name</span>
        </label>
        <input
          type="text"
          className="input input-bordered"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
        />
      </div>
      
      <div className="form-control">
        <label className="label">
          <span className="label-text">Email</span>
        </label>
        <input
          type="email"
          className="input input-bordered"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required
        />
      </div>
      
      <div className="form-control">
        <label className="label">
          <span className="label-text">Message</span>
        </label>
        <textarea
          className="textarea textarea-bordered"
          rows={4}
          value={formData.message}
          onChange={(e) => setFormData({...formData, message: e.target.value})}
          required
        />
      </div>
      
      <button
        type="submit"
        className="btn btn-primary w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <span className="loading loading-spinner loading-xs"></span>
        ) : (
          "Send Message"
        )}
      </button>
    </form>
  );
};

export default ContactForm;
```

## Configuration Management

### Using Config Throughout the App
```javascript
// Always import and use the centralized config
import config from "@/config";

// Access app settings
const appName = config.appName;
const domain = config.domainName;
const stripePublicKey = config.stripe.plans[0].priceId;

// Use in components
<title>{`${pageTitle} - ${config.appName}`}</title>
<meta name="description" content={config.appDescription} />
```

### Environment Variables
```javascript
// Always validate required environment variables
if (!process.env.REQUIRED_VAR) {
  throw new Error("REQUIRED_VAR environment variable is not set");
}
```

## Testing Considerations

### API Route Testing
```javascript
// Test API routes with proper error handling
const testApiRoute = async () => {
  const response = await fetch("/api/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ test: true }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  return response.json();
};
```

## Common Pitfalls to Avoid

1. **Don't use Client Components unnecessarily** - Use Server Components by default
2. **Always handle loading states** - Users should know when operations are in progress
3. **Validate inputs** - Never trust user input, validate on both client and server
4. **Don't hardcode values** - Use the config file for app-wide settings
5. **Handle errors gracefully** - Provide meaningful error messages to users
6. **Don't forget database connections** - Always call `connectMongo()` before database operations
7. **Use absolute imports** - Prefer `@/` imports over relative paths
8. **Follow naming conventions** - Maintain consistency with existing codebase

## Deployment Checklist

Before deploying:
- [ ] All environment variables are set
- [ ] Stripe webhooks are configured
- [ ] MongoDB connection is established
- [ ] NextAuth domain is configured
- [ ] Email provider is set up
- [ ] Build process completes without errors
- [ ] All API routes are tested
- [ ] Payment flow is tested with Stripe test mode

Remember: Always prioritize user experience, maintain consistency with existing patterns, and ensure robust error handling throughout the application. 