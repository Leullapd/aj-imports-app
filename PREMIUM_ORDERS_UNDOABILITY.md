# Premium Orders Payment Undoability Rules

## Overview
The premium orders payment system now has specific rules for when payment statuses can be undone by administrators.

## Rules

### Full Payment Orders
- **Verification**: Once a full payment is verified, it **cannot be undone**
- **Rejection**: Once a full payment is rejected, it **cannot be undone**

### Installment Payment Orders

#### First Payment
- **Verification**: Once the first payment is verified, it **cannot be undone**
- **Rejection**: Once the first payment is rejected, it **cannot be undone**

#### Second Payment
- **Verification**: Once the second payment is verified, it **cannot be undone**
- **Rejection**: Once the second payment is rejected, it **CAN be undone** (since the item is already purchased with the first payment)

## UI Indicators

### Disabled Controls
- Payment status dropdowns are automatically disabled when the status cannot be changed
- Disabled dropdowns appear grayed out and are non-interactive

### Status Notes
- **⚠️ Warning Notes**: Appear when a status cannot be undone
  - "⚠️ Full payment status cannot be undone"
  - "⚠️ First payment status cannot be undone"
  - "⚠️ Second payment verification cannot be undone"

- **ℹ️ Info Notes**: Appear when a status can be undone
  - "ℹ️ Second payment rejection can be undone"

## Backend Validation
The server enforces these rules and will return error messages if an admin attempts to undo a status that cannot be undone:

- "Payment verification cannot be undone. Once a payment is verified, it cannot be changed back."
- "Payment rejection cannot be undone for full payment orders. Once a payment is rejected, it cannot be changed back."
- "First payment rejection cannot be undone. Once a payment is rejected, it cannot be changed back."

## Business Logic
- For full payments: Once verified/rejected, the decision is final
- For installment payments: First payment decisions are final, but second payment rejections can be reversed since the item is already purchased
- This prevents inventory issues and maintains data integrity
