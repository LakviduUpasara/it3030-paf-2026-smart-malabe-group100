import { useEffect, useState } from "react";
import Button from "../components/Button";
import Card from "../components/Card";
import {
  createCategory,
  createSubCategory,
  deleteCategory,
  getCategories,
  getSubCategories,
  updateCategory,
} from "../services/categoryService";

const initialCategoryForm = { id: "", name: "", icon: "tools", color: "#3B82F6" };

function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [categoryForm, setCategoryForm] = useState(initialCategoryForm);
  const [subCategoryName, setSubCategoryName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadCategories = async () => {
    const res = await getCategories();
    setCategories(Array.isArray(res.data) ? res.data : []);
  };

  useEffect(() => {
    loadCategories().catch((loadError) => setError(loadError.message));
  }, []);

  useEffect(() => {
    if (!selectedCategoryId) {
      setSubCategories([]);
      return;
    }
    getSubCategories(selectedCategoryId)
      .then((res) => setSubCategories(Array.isArray(res.data) ? res.data : []))
      .catch((subError) => setError(subError.message));
  }, [selectedCategoryId]);

  const onSaveCategory = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    try {
      if (categoryForm.id) {
        await updateCategory(categoryForm.id, {
          name: categoryForm.name,
          icon: categoryForm.icon,
          color: categoryForm.color,
        });
      } else {
        await createCategory(categoryForm);
      }
      setCategoryForm(initialCategoryForm);
      await loadCategories();
      setSuccess("Category saved successfully.");
    } catch (saveError) {
      setError(saveError.message);
    }
  };

  const onDeleteCategory = async (id) => {
    setError("");
    setSuccess("");
    try {
      await deleteCategory(id);
      if (selectedCategoryId === id) {
        setSelectedCategoryId("");
      }
      await loadCategories();
      setSuccess("Category deleted successfully.");
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  const onCreateSubCategory = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!selectedCategoryId) {
      setError("Select a category first.");
      return;
    }
    try {
      await createSubCategory({
        name: subCategoryName,
        categoryId: selectedCategoryId,
      });
      const res = await getSubCategories(selectedCategoryId);
      setSubCategories(Array.isArray(res.data) ? res.data : []);
      setSubCategoryName("");
      setSuccess("Subcategory created.");
    } catch (subError) {
      setError(subError.message);
    }
  };

  return (
    <div className="page-stack">
      {error ? <p className="alert alert-error">{error}</p> : null}
      {success ? <p className="alert alert-success">{success}</p> : null}
      <Card title="Category Management">
        <form className="form-grid" onSubmit={onSaveCategory}>
          <label className="field">
            <span>Category Name</span>
            <input
              required
              value={categoryForm.name}
              onChange={(event) =>
                setCategoryForm((prev) => ({ ...prev, name: event.target.value }))
              }
            />
          </label>
          <label className="field">
            <span>Icon</span>
            <input
              required
              value={categoryForm.icon}
              onChange={(event) =>
                setCategoryForm((prev) => ({ ...prev, icon: event.target.value }))
              }
            />
          </label>
          <label className="field">
            <span>Color</span>
            <input
              required
              type="color"
              value={categoryForm.color}
              onChange={(event) =>
                setCategoryForm((prev) => ({ ...prev, color: event.target.value }))
              }
            />
          </label>
          <div className="field">
            <Button type="submit">{categoryForm.id ? "Update Category" : "Add Category"}</Button>
          </div>
        </form>
      </Card>

      <Card title="Existing Categories">
        <div className="list-stack">
          {categories.map((category) => (
            <article className="my-ticket-item" key={category.id}>
              <div className="my-ticket-main">
                <strong>{category.name}</strong>
                <p className="supporting-text">{category.icon} | {category.color}</p>
              </div>
              <div className="button-row">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setCategoryForm(category)}
                >
                  Edit
                </Button>
                <Button type="button" variant="ghost" onClick={() => onDeleteCategory(category.id)}>
                  Delete
                </Button>
                <Button type="button" onClick={() => setSelectedCategoryId(category.id)}>
                  Subcategories
                </Button>
              </div>
            </article>
          ))}
        </div>
      </Card>

      <Card title="Subcategory Management">
        <form className="form-grid" onSubmit={onCreateSubCategory}>
          <label className="field">
            <span>Category</span>
            <select
              value={selectedCategoryId}
              onChange={(event) => setSelectedCategoryId(event.target.value)}
            >
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Subcategory Name</span>
            <input
              required
              value={subCategoryName}
              onChange={(event) => setSubCategoryName(event.target.value)}
            />
          </label>
          <div className="field">
            <Button type="submit">Add Subcategory</Button>
          </div>
        </form>
        <div className="list-stack">
          {subCategories.map((subCategory) => (
            <p key={subCategory.id} className="supporting-text">
              {subCategory.name}
            </p>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default AdminCategoriesPage;
