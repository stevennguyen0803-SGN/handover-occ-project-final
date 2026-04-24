<!-- PHASE 1 APPROVED -->

# Data Model - OCC Handover System

> **Agent instruction:** This is the canonical data model. Generate Prisma schema from this.
> Do not invent field names - use exactly the names defined here.

---

## Prisma Schema

```prisma
// database/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ------------------------------------------------------------
// ENUMS
// ------------------------------------------------------------

enum Shift {
  Morning
  Afternoon
  Night
}

enum Priority {
  Low
  Normal
  High
  Critical
}

enum ItemStatus {
  Open
  Monitoring
  Resolved
}

enum UserRole {
  OCC_STAFF
  SUPERVISOR
  MANAGEMENT_VIEWER
  ADMIN
}

enum AuditAction {
  CREATED
  UPDATED
  STATUS_CHANGED
  ACKNOWLEDGED
  CARRIED_FORWARD
  DELETED
}

// ------------------------------------------------------------
// USER
// ------------------------------------------------------------

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  passwordHash String? // required for credentials auth, nullable for SSO-only users
  role      UserRole @default(OCC_STAFF)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  handoversPrepared Handover[]      @relation("PreparedBy")
  handoversReceived Handover[]      @relation("HandedTo")
  auditLogs         AuditLog[]
  acknowledgments   Acknowledgment[]
}

// ------------------------------------------------------------
// HANDOVER (main record)
// ------------------------------------------------------------

model Handover {
  id               String     @id @default(cuid())
  referenceId      String     @unique // e.g. "HDO-2025-001234" - auto-generated
  handoverDate     DateTime   @db.Date
  shift            Shift
  preparedById     String
  handedToId       String?

  overallPriority  Priority
  overallStatus    ItemStatus @default(Open)
  generalRemarks   String?
  nextShiftActions String?    // structured text block

  // carry-forward
  isCarriedForward Boolean    @default(false)
  carriedFromId    String?
  carriedFrom      Handover?  @relation("CarryForward", fields: [carriedFromId], references: [id])
  carriedForwardTo Handover[] @relation("CarryForward")

  submittedAt      DateTime?
  acknowledgedAt   DateTime?
  deletedAt        DateTime?
  createdAt        DateTime   @default(now())
  updatedAt        DateTime   @updatedAt

  preparedBy       User       @relation("PreparedBy", fields: [preparedById], references: [id])
  handedTo         User?      @relation("HandedTo", fields: [handedToId], references: [id])

  // operational categories
  aircraftItems       AircraftItem[]
  airportItems        AirportItem[]
  flightScheduleItems FlightScheduleItem[]
  crewItems           CrewItem[]
  weatherItems        WeatherItem[]
  systemItems         SystemItem[]
  abnormalEvents      AbnormalEvent[]

  auditLogs       AuditLog[]
  acknowledgments Acknowledgment[]

  @@index([handoverDate, shift])
  @@index([overallStatus])
  @@index([overallPriority])
  @@index([deletedAt])
}

// ------------------------------------------------------------
// OPERATIONAL CATEGORY ITEMS
// Each category supports multiple items per handover
// ------------------------------------------------------------

model AircraftItem {
  id              String     @id @default(cuid())
  handoverId      String
  registration    String     // e.g. "9M-XXA"
  type            String?    // aircraft type e.g. "A320"
  issue           String
  status          ItemStatus @default(Open)
  priority        Priority   @default(Normal)
  flightsAffected String?
  ownerId         String?    // user responsible for follow-up
  dueTime         DateTime?
  remarks         String?
  resolvedAt      DateTime?
  deletedAt       DateTime?
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  handover        Handover   @relation(fields: [handoverId], references: [id], onDelete: Cascade)

  @@index([handoverId])
  @@index([status])
  @@index([deletedAt])
}

model AirportItem {
  id              String     @id @default(cuid())
  handoverId      String
  airport         String     // ICAO code e.g. "WMKK"
  issue           String
  status          ItemStatus @default(Open)
  priority        Priority   @default(Normal)
  flightsAffected String?
  ownerId         String?
  dueTime         DateTime?
  remarks         String?
  resolvedAt      DateTime?
  deletedAt       DateTime?
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  handover        Handover   @relation(fields: [handoverId], references: [id], onDelete: Cascade)

  @@index([handoverId])
  @@index([deletedAt])
}

model FlightScheduleItem {
  id              String     @id @default(cuid())
  handoverId      String
  flightNumber    String
  route           String?    // e.g. "KUL-SIN"
  issue           String
  status          ItemStatus @default(Open)
  priority        Priority   @default(Normal)
  ownerId         String?
  dueTime         DateTime?
  remarks         String?
  resolvedAt      DateTime?
  deletedAt       DateTime?
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  handover        Handover   @relation(fields: [handoverId], references: [id], onDelete: Cascade)

  @@index([handoverId])
  @@index([deletedAt])
}

model CrewItem {
  id              String     @id @default(cuid())
  handoverId      String
  crewId          String?    // employee ID if known
  crewName        String?
  role            String?    // Captain, FO, Cabin Crew
  issue           String
  status          ItemStatus @default(Open)
  priority        Priority   @default(Normal)
  flightsAffected String?
  ownerId         String?
  dueTime         DateTime?
  remarks         String?
  resolvedAt      DateTime?
  deletedAt       DateTime?
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  handover        Handover   @relation(fields: [handoverId], references: [id], onDelete: Cascade)

  @@index([handoverId])
  @@index([deletedAt])
}

model WeatherItem {
  id              String     @id @default(cuid())
  handoverId      String
  affectedArea    String     // airport ICAO or region
  weatherType     String     // e.g. "Thunderstorm", "Low Visibility"
  issue           String
  status          ItemStatus @default(Open)
  priority        Priority   @default(Normal)
  flightsAffected String?
  ownerId         String?
  dueTime         DateTime?
  remarks         String?
  resolvedAt      DateTime?
  deletedAt       DateTime?
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  handover        Handover   @relation(fields: [handoverId], references: [id], onDelete: Cascade)

  @@index([handoverId])
  @@index([deletedAt])
}

model SystemItem {
  id              String     @id @default(cuid())
  handoverId      String
  systemName      String     // e.g. "ACARS", "DCS", "AIMS"
  issue           String
  status          ItemStatus @default(Open)
  priority        Priority   @default(Normal)
  ownerId         String?
  dueTime         DateTime?
  remarks         String?
  resolvedAt      DateTime?
  deletedAt       DateTime?
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  handover        Handover   @relation(fields: [handoverId], references: [id], onDelete: Cascade)

  @@index([handoverId])
  @@index([deletedAt])
}

model AbnormalEvent {
  id              String     @id @default(cuid())
  handoverId      String
  eventType       String     // e.g. "AOG", "Diversion", "Security"
  description     String
  flightsAffected String?
  notificationRef String?    // internal escalation or NOC ref
  status          ItemStatus @default(Open)
  priority        Priority   @default(High)
  ownerId         String?
  dueTime         DateTime?
  resolvedAt      DateTime?
  deletedAt       DateTime?
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  handover        Handover   @relation(fields: [handoverId], references: [id], onDelete: Cascade)

  @@index([handoverId])
  @@index([status])
  @@index([deletedAt])
}

// ------------------------------------------------------------
// AUDIT LOG
// ------------------------------------------------------------

model AuditLog {
  id          String      @id @default(cuid())
  handoverId  String
  userId      String
  action      AuditAction
  targetModel String      // e.g. "Handover", "AircraftItem"
  targetId    String
  oldValue    Json?       // snapshot before change
  newValue    Json?       // snapshot after change
  createdAt   DateTime    @default(now())

  handover    Handover    @relation(fields: [handoverId], references: [id])
  user        User        @relation(fields: [userId], references: [id])

  @@index([handoverId])
  @@index([createdAt])
}

// ------------------------------------------------------------
// ACKNOWLEDGMENT
// ------------------------------------------------------------

model Acknowledgment {
  id             String   @id @default(cuid())
  handoverId     String
  userId         String
  acknowledgedAt DateTime @default(now())
  notes          String?

  handover       Handover @relation(fields: [handoverId], references: [id])
  user           User     @relation(fields: [userId], references: [id])

  @@unique([handoverId, userId])
}
```

---

## Reference ID Format

Auto-generate `referenceId` on handover creation:

```typescript
// Format: HDO-YYYY-NNNNNN
// Example: HDO-2025-000042
// Use a database-backed monotonic sequence.
// Never derive the suffix from count(), because deletes and concurrent creates can reuse numbers.

async function generateReferenceId(prisma: PrismaClient): Promise<string> {
  const year = new Date().getUTCFullYear()
  const result = await prisma.$queryRaw<{ value: bigint }[]>`
    SELECT nextval('handover_reference_seq') AS value
  `
  const sequenceValue = result[0]?.value

  if (!sequenceValue) {
    throw new Error('REFERENCE_ID_SEQUENCE_FAILED')
  }

  return `HDO-${year}-${sequenceValue.toString().padStart(6, '0')}`
}
```

---

## Field Validation Rules

| Field | Rule |
| --- | --- |
| `handoverDate` | Required. Cannot be more than 7 days in the past. Cannot be future. |
| `shift` | Required. One of: Morning / Afternoon / Night |
| `preparedById` | Required. Must be a valid active User. |
| `User.passwordHash` | Required for credentials-authenticated users. Nullable only for SSO-only users. |
| `overallPriority` | Required. Defaults to Normal. |
| `referenceId` | Auto-generated. Never user-supplied. |
| `AbnormalEvent.flightsAffected` | Required if `eventType` is AOG or Diversion. |
| `AbnormalEvent.notificationRef` | Required if `priority` is Critical. |
| item `dueTime` | Must be in the future at time of creation and within 72 hours of the handover date. |
| item `ownerId` | Required if `status` is Open and `priority` is High or Critical. |
