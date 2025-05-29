# School-Age-Child-Monitoring-System
A complete IoT system built to track child location data using wireless sensor networks, blockchain, and cloud dashboards.

---

## 🔧 Technologies Used
- **Contiki OS (Cooja)** – for WSN simulation
- **Ubidots** – for cloud-based real-time GPS visualization
- **JSON Server** – for local database backup
- **Hyperledger Fabric** – for secure blockchain storage

---

## 🗺️ Sensor Network Overview

- 4 Border Routers (Z1)
- Each with 4 Client Sensor Motes
- Data: Latitude (°N) and Longitude (°E)
- Wireless movement simulated via `position.dat`

---

## 🚀 Setup Instructions

### ✅ 1. Install Prerequisites

Install:
- [Node.js & npm](https://nodejs.org)
- [Docker & Docker Compose](https://www.docker.com/)
- [Git](https://git-scm.com/)
- Java JDK 8 (for Cooja simulator)

Install global npm tools:
```bash
npm install -g json-server

**Run Contiki Simulation (Cooja)**
Open terminal:

bash
Copy
Edit
cd ~/contiki-3.0/tools/cooja
sudo ant run


Create a simulation
Add:

4 Border Routers using border-router.c

4 Clients under each, using t5_websense-sky.c

Load movement data via:

arduino
Copy
Edit
position.dat
Setup 4 serial sockets and run:

bash
Copy
Edit
sudo ./tunslip6 -a 127.0.0.1 -p 60001 aaaa::1/64 -t tun1
sudo ./tunslip6 -a 127.0.0.1 -p 60002 aaab::1/64 -t tun2
sudo ./tunslip6 -a 127.0.0.1 -p 60003 aaac::1/64 -t tun3
sudo ./tunslip6 -a 127.0.0.1 -p 60004 aaad::1/64 -t tun4
✅ 3. Run JSON Local Server
In the folder with gps_data.json:

bash
Copy
Edit
json-server -w gps_data.json
✅ 4. Setup Hyperledger Fabric
bash
Copy
Edit
mkdir fabric-project && cd fabric-project
curl -sSL https://bit.ly/2ysbOFE | bash -s
cd fabric-samples/test-network
./network.sh up createChannel -c mychannel -ca
./network.sh deployCC -ccn basic -ccp ../asset-transfer-basic/chaincode-javascript/ -ccl javascript
✅ 5. Run the Node.js App
Place these files:

assetTransfer.js → asset-transfer-basic/chaincode-javascript/lib/

t5.js → asset-transfer-basic/application-javascript/

In asset-transfer-basic/application-javascript:

bash
Copy
Edit
npm install axios fabric-network fabric-ca-client
node t5.js
This will:

Dynamically fetch IPv6 sensor clients

Fetch historic GPS data from JSON server

Submit to Hyperledger Fabric

Visualize via Ubidots

Store local backup

📊 Real-Time Dashboard
Ubidots visualizes live GPS coordinates.

Sensor data is polled every 10 seconds.

Supports device mobility and data recovery.
