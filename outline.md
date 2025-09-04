#### **1. Frontend (Web App)**

* **Technology:** **React.js (using Vite)**
* **Justification:**
    * **Rapid Development:** Vite provides an extremely fast development server and build process, allowing for instant feedback on UI changes, which is crucial in a hackathon setting.
    * **Modern UI/UX:** React's component-based architecture and vast ecosystem of libraries (like `Recharts` for charts or Material-UI for components) allow you to quickly build a polished, interactive dashboard that directly addresses the "Financial Visibility" success metric.
    * **Seamless API Integration:** React is excellent at consuming data from REST APIs, making it straightforward to connect to the FastAPI backend.
    * **Plaid Web Support:** Plaid provides an official React component (`Plaid Link`) that handles the entire secure bank connection flow out of the box.

#### **2. Backend (API & AI Logic)**

* **Technology:** **Python with FastAPI**
* **Justification:**
    * **Unified Codebase:** This is the primary advantage. Your core API logic and your AI/machine learning models (using libraries like Pandas and Scikit-learn) live in the same application. This eliminates the need for a separate microservice, radically simplifying development, testing, and deployment.
    * **High Performance:** FastAPI is one of the fastest web frameworks available for Python, delivering performance comparable to Node.js, ensuring your application feels responsive.
    * **Automatic Interactive Docs:** FastAPI automatically generates interactive API documentation (Swagger UI). This is a massive time-saver, as it allows the frontend to see and test every endpoint without any extra work.
    * **Built-in Data Validation:** By using Python type hints, FastAPI automatically validates incoming data, which helps prevent bugs and improves the overall security and reliability of your application.
    * **Direct AI Integration:** You can directly import `Pandas` and `Scikit-learn` to perform trend analysis, anomaly detection, and subscription identification right within your API endpoints, perfectly fulfilling the "AI Application" success metric.

#### **3. Database**

* **Technology:** **SQLite**
* **Justification:**
    * **Ultimate Simplicity:** SQLite is a serverless, file-based database. There is **zero configuration** required—it's just a file in your project directory. This is the fastest and easiest way to get a database running for a hackathon.
    * **Perfect for an MVP:** For a prototype and demo, SQLite is more than capable of handling the data for a handful of users. It removes the complexity of managing a separate database server.
    * **Excellent Python Support:** Python has a built-in `sqlite3` module, and SQLite integrates seamlessly with popular Python ORMs like **SQLAlchemy** (which is highly recommended with FastAPI) for structured and safe database queries.
    * **Portability:** The entire application, including the database, is self-contained, making it incredibly easy to run on any machine.

#### **4. Third-Party Service for Bank Integration**

* **Technology:** **Plaid API**
* **Justification:**
    * **Core Functionality:** Securely connecting to bank accounts is a non-negotiable feature that is too complex to build in a hackathon. Plaid is the industry standard.
    * **Trust and Security:** Plaid handles all sensitive credential management through tokenization. Your application never sees or stores user bank passwords, which is a massive win for the "Trust and Security" metric.
    * **Clean Data:** Plaid provides cleaned and categorized transaction data, giving your AI models a great starting point for analysis.
    * **Free Sandbox:** Plaid offers a full-featured sandbox environment for development, allowing you to build and test your entire application with realistic fake data.

#### **5. Deployment**

* **Technology:** **Render**
* **Justification:**
    * **Simplicity and Speed:** Render is a Platform-as-a-Service (PaaS) provider that simplify deployment to a `git push`. It handle the server infrastructure, allowing you to focus on your code.
    * **Python Support:** Render has excellent, well-documented support for deploying FastAPI applications.
    * **Free Tiers:** Render has free tiers are sufficient for hosting a hackathon prototype.
    * **Note on SQLite:** While SQLite is perfect for development, some PaaS free tiers use ephemeral filesystems (which are deleted on restart). For the hackathon demo, this is usually fine, but Render's free tier offers persistent disk services, which makes it slightly more robust for deploying an app with SQLite.
