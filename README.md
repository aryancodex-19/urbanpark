# UrbanServe - Smart City Public Parking Network

## 🔗 Live Dashboards
*   **User Dashboard:** https://urbanserve-parking.vercel.app
*   **Operator Dashboard:** https://urbanserve-parking.vercel.app/operator

## 📌 Problem Statement
To observe public service usage and demonstrate a very basic system for efficient operation.

## 🚀 Project Overview
UrbanServe is a smart city civic service model designed to solve parking issues in urban areas. It provides a real-time, interactive platform where citizens can observe parking availability and book slots, while municipal operators can manage ground-level operations efficiently. 

The system simulates a network of 8 municipal parking hubs across Mira Road, enabling users to find, filter, and book parking slots seamlessly.

## ✨ Key Features

### 👤 User Side (Citizen Portal)
*   **Hero Landing Page:** Sleek welcome page with live metrics and a 3-step guide.
*   **Interactive Map:** Leaflet.js powered map showing 8 parking hubs with real-time availability (Green = Available, Red = Occupied).
*   **Smart Filtering:** Filter slots by "Available Only", "Zone A", or "Zone B", plus a real-time search bar (e.g., "A04").
*   **Seamless Booking:** One-click slot booking with instant toast notifications.
*   **My Bookings:** A dedicated tab to view and cancel active bookings.
*   **Demo User Switcher:** Easily switch between `user1`, `user2`, and `user3` to demonstrate isolated user bookings.

### 🛡️ Operator Side (Admin Portal)
*   **Secure Access:** Protected by a 4-digit PIN gate (Demo PIN: `1234`) and an official Staff Badge.
*   **Multi-Facility Management:** Select any of the 8 hubs to view and manage its specific slots.
*   **Manual Overrides:** Operators can manually mark slots as `Available`, `Occupied`, or `Maintenance`.
*   **Live Statistics:** Real-time KPI dashboard showing Total, Available, Occupied, and Maintenance counts.
*   **Cross-Tab Sync:** Changes made by the operator instantly reflect on the user's dashboard without a page reload.
