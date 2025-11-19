# Frontend Development Guide

## Quick Reference

### Starting Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

### File Locations

| What | Where |
|------|-------|
| Pages | `src/pages/` |
| Components | `src/components/` |
| API Config | `src/api/axios.js` |
| Auth Context | `src/context/AuthContext.jsx` |
| Routes | `src/App.jsx` |
| Styles | `src/index.css` |

### Common Tasks

#### Add a New Page

1. Create file: `src/pages/NewPage.jsx`
2. Add route in `src/App.jsx`:
   ```jsx
   import NewPage from "./pages/NewPage";
   
   <Route path="/new-page" element={<NewPage />} />
   ```
3. Add navigation link if needed

#### Add a New API Endpoint

1. Use existing axios instance:
   ```jsx
   import api from "../api/axios";
   
   const response = await api.get("/endpoint");
   ```

#### Add Authentication to Page

```jsx
import { useAuth } from "../context/AuthContext";

function MyPage() {
  const { user, isAuthenticated } = useAuth();
  // ...
}
```

#### Protect a Route

```jsx
<Route
  path="/protected"
  element={
    <ProtectedRoute>
      <ProtectedPage />
    </ProtectedRoute>
  }
/>
```

### Code Snippets

#### Loading State Pattern

```jsx
const [loading, setLoading] = useState(true);

if (loading) {
  return <LoadingSpinner />;
}
```

#### Error Handling Pattern

```jsx
const [error, setError] = useState("");

try {
  // API call
} catch (err) {
  setError(err.message);
}

{error && <ErrorMessage message={error} />}
```

#### API Call Pattern

```jsx
useEffect(() => {
  const fetchData = async () => {
    try {
      const response = await api.get("/endpoint");
      setData(response.data);
    } catch (err) {
      setError(err.message);
    }
  };
  fetchData();
}, []);
```

### Styling Quick Reference

```jsx
// Container
<div className="max-w-7xl mx-auto px-4 py-8">

// Card
<div className="bg-white shadow rounded-lg p-6">

// Button
<button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">

// Grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

### Debugging Tips

1. **Check Browser Console** - F12 → Console tab
2. **Network Tab** - Check API requests/responses
3. **React DevTools** - Inspect component state
4. **Local Storage** - Check token storage
5. **Backend Logs** - Verify server is receiving requests

### Environment Setup

- **Frontend:** `http://localhost:5173`
- **Backend:** `http://localhost:8080`
- **Firebase:** Configured in `src/firebase.js`

