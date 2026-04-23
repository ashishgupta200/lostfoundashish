import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState(null);

  const emptyForm = {
    itemName: "",
    description: "",
    type: "Lost",
    location: "",
    date: "",
    contactInfo: "",
  };
  const [formData, setFormData] = useState(emptyForm);

  const headers = { Authorization: `Bearer ${token}` };

  // Fetch all items on mount
  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/items`, { headers });
      setItems(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        handleLogout();
      }
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Add or Update item
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      if (editingId) {
        await axios.put(`${API_URL}/api/items/${editingId}`, formData, {
          headers,
        });
        setSuccess("Item updated successfully!");
        setEditingId(null);
      } else {
        await axios.post(`${API_URL}/api/items`, formData, { headers });
        setSuccess("Item added successfully!");
      }
      setFormData(emptyForm);
      fetchItems();
    } catch (err) {
      setError(err.response?.data?.message || "Operation failed");
    }
  };

  // Delete item
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      await axios.delete(`${API_URL}/api/items/${id}`, { headers });
      setSuccess("Item deleted successfully!");
      fetchItems();
    } catch (err) {
      setError(err.response?.data?.message || "Delete failed");
    }
  };

  // Edit item - populate form
  const handleEdit = (item) => {
    setEditingId(item._id);
    setFormData({
      itemName: item.itemName,
      description: item.description,
      type: item.type,
      location: item.location,
      date: item.date ? item.date.split("T")[0] : "",
      contactInfo: item.contactInfo,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setFormData(emptyForm);
  };

  // Search items
  const handleSearch = async () => {
    setError("");
    if (!searchQuery.trim()) {
      fetchItems();
      return;
    }
    try {
      const res = await axios.get(
        `${API_URL}/api/items/search?name=${searchQuery}`,
        { headers }
      );
      setItems(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Search failed");
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
    fetchItems();
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
    window.location.reload();
  };

  return (
    <>
      {/* Navbar */}
      <div className="navbar">
        <h2>Lost &amp; Found System</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <span>Welcome, {user.name}</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="dashboard">
        {error && <div className="error-msg">{error}</div>}
        {success && <div className="success-msg">{success}</div>}

        {/* Add / Edit Item Form */}
        <div className="item-form">
          <h3>{editingId ? "Edit Item" : "Report Lost / Found Item"}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <input
                type="text"
                name="itemName"
                placeholder="Item Name"
                value={formData.itemName}
                onChange={handleChange}
                required
              />
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
              >
                <option value="Lost">Lost</option>
                <option value="Found">Found</option>
              </select>
              <input
                type="text"
                name="location"
                placeholder="Location"
                value={formData.location}
                onChange={handleChange}
                required
              />
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
              />
              <input
                type="text"
                name="contactInfo"
                placeholder="Contact Info (Phone / Email)"
                value={formData.contactInfo}
                onChange={handleChange}
                required
              />
              <textarea
                name="description"
                placeholder="Description of the item..."
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {editingId ? "Update Item" : "Add Item"}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={cancelEdit}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Search Bar */}
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search items by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button className="btn-primary" onClick={handleSearch}>
            Search
          </button>
          {searchQuery && (
            <button className="btn-secondary" onClick={clearSearch}>
              Clear
            </button>
          )}
        </div>

        {/* Items List */}
        <h3>All Reported Items ({items.length})</h3>
        <div className="items-list">
          {items.length === 0 ? (
            <div className="no-items">No items found.</div>
          ) : (
            items.map((item) => (
              <div
                key={item._id}
                className={`item-card ${item.type.toLowerCase()}`}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <h4>{item.itemName}</h4>
                    <span
                      className={`badge ${
                        item.type === "Lost" ? "badge-lost" : "badge-found"
                      }`}
                    >
                      {item.type}
                    </span>
                  </div>
                </div>
                <p>
                  <strong>Description:</strong> {item.description}
                </p>
                <p>
                  <strong>Location:</strong> {item.location}
                </p>
                <p>
                  <strong>Date:</strong>{" "}
                  {new Date(item.date).toLocaleDateString()}
                </p>
                <p>
                  <strong>Contact:</strong> {item.contactInfo}
                </p>
                <p>
                  <strong>Reported by:</strong> {item.user?.name || "Unknown"}
                </p>
                {/* Show Edit/Delete only for own items */}
                {item.user?._id === user.id && (
                  <div className="item-actions">
                    <button
                      className="btn-edit"
                      onClick={() => handleEdit(item)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-danger"
                      onClick={() => handleDelete(item._id)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

export default Dashboard;
