# Mini ERP System Integration

A modern, full-stack Mini Enterprise Resource Planning (ERP) application with automated workflows, real-time tracking, and relational integrity.

---

## 🚀 Tech Stack

### Frontend
- **Framework**: React (TypeScript) + Vite
- **State Management**: Redux Toolkit (Async Thunks)
- **UI Components**: Material-UI (MUI)
- **Form Handling**: React Hook Form + Yup Validation

### Backend
- **Framework**: Spring Boot (Java 21)
- **Data Access**: Spring Data JPA + Hibernate
- **Database**: PostgreSQL (Neon Tech)
- **Authentication**: JWT & Spring Security

---

## 🛠 Key Features

1. **Bill of Materials (BoM)**
   - Link finished manufactured goods to component lists.
   - Configure dynamic component requirements and quantities.

2. **On-the-Fly Component Auto-Creation**
   - Create raw materials dynamically from the finished product form or the BoM creation dialog.
   - Component names entered as free text are auto-saved as Purchased (`MTS`) raw materials if not already present.

3. **Manufacturing Workflows**
   - Manage Manufacturing Orders (MO) from draft to completion.
   - Track live Work Center Operations (e.g., Cutting, Assembly, Upholstery).
   - Automatically consume components and issue finished products upon completion.

4. **Procurement & Inventory**
   - Track current On Hand and Reserved stock levels.
   - Run full-cycle Purchase Orders (PO) to buy raw materials and Sales Orders (SO) to ship finished products.
   - Automated procurement rules (MTS/MTO) and reordering schedulers.
   - Automatic inventory ledger movements tracked on every transaction.

5. **Centralized System Audit Trail**
   - Real-time event tracking at the database and service layers.
   - Full visibility into user activity across all business units.

---

## 🔐 Security & Access Control (RBAC)

The application implements granular Role-Based Access Control (RBAC) filtering views and API access dynamically.

### Default System Users

| Role | Username | Password | Access Privileges |
|------|----------|----------|-------------------|
| **Admin** | `admin` | `admin123` | Full access, user management, and configuration |
| **Owner** | `owner` | `owner123` | High-level operations and dashboard reporting |
| **Sales** | `sales` | `sales123` | Sales Orders, Customers |
| **Purchase** | `purchase` | `purchase123` | Purchase Orders, Vendors |
| **Manufacturing** | `mfg` | `mfg123` | BoM, Work Centers, Manufacturing Orders |
| **Inventory** | `inventory` | `inventory123` | Inventory levels, Transfers, Reordering rules |

---

## 🏃‍♂️ Getting Started

### Prerequisites
- Java 21 (JDK) Installed
- Node.js (v18+) Installed
- PostgreSQL Database Connection

### Running the Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Run the application using the Maven wrapper:
   ```bash
   ./mvnw spring-boot:run
   ```
   *The server runs on port `8080`.*

### Running the Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The dev server runs on port `5173`.*
