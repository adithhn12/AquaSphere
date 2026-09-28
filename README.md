# 🌊 AquaSphere AI

AquaSphere AI is an intelligent water-resource management platform designed to help citizens, field workers, and water authorities monitor and manage water-related issues through a unified digital system.

🔗 **Live Demo:** https://aquasphereai.vercel.app

---

## 🎯 Problem Statement

Water-resource management often involves fragmented communication between citizens, field workers, and authorities.

Common challenges include:

- Difficulty reporting water-related issues
- Delayed communication between citizens and authorities
- Manual tracking of field operations
- Limited visibility into ongoing issues
- Difficulty managing water-resource information efficiently

---

## 💡 Solution

AquaSphere AI provides a centralized platform where different users can interact with the water-management system based on their roles.

The platform supports role-based access for:

- 👤 Citizens
- 🚚 Field Workers / Drivers
- 🏢 BWSSB Managers
- 🌐 Guests

Users can report and manage water-related issues while authorities can monitor and coordinate operations through the platform.

---

## ✨ Features

### 🔐 Role-Based Access

Different access modes provide users with functionality relevant to their role.

### 👤 Citizen Portal

Citizens can interact with the system to report water-related issues and access relevant information.

### 🚚 Field Worker Module

Field workers can receive and manage operational tasks related to water-resource issues.

### 🏢 BWSSB Manager Dashboard

Managers can oversee reported issues, field operations, and system information.

### 💾 Firebase Integration

Firebase is used for:

- Authentication
- Firestore database
- Real-time data management

### 📊 Centralized Management

AquaSphere brings citizen reports, field operations, and administrative management together in a single platform.

---

## 🏗️ Architecture

AquaSphere follows a role-based architecture where citizens, field workers, and managers interact with the platform through a unified application.

**Users → AquaSphere AI → Firebase Authentication & Firestore**

---

## 🛠️ Tech Stack

- React
- TypeScript
- Vite
- Firebase Authentication
- Firebase Firestore
- Vercel
- Git
- GitHub

---

## 🚀 Getting Started

### 1. Clone the repository

git clone https://github.com/adithhn12/AquaSphere.git

cd AquaSphere

### 2. Install dependencies

npm install

### 3. Configure environment variables

Create a `.env` file in the project root:

VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

### 4. Start the development server

npm run dev

The application will be available through the Vite development server.

---

## 🌐 Deployment

AquaSphere AI is deployed using Vercel.

The GitHub repository is connected to Vercel for automatic deployments whenever changes are pushed to the `main` branch.

🔗 **Live Application:** https://aquasphereai.vercel.app

---

## 🔮 Future Enhancements

- AI-assisted water issue classification
- Real-time location-based issue tracking
- Automated notifications
- Predictive water-resource analytics
- Advanced manager dashboards
- Mobile application support
- Integration with additional water-management services

---

## 👥 Team

Developed as a hackathon project by the AquaSphere team.

---

## 📄 License

This project is intended for educational and hackathon purposes.
