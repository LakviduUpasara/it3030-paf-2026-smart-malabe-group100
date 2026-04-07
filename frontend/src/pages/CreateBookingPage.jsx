import { useState } from "react";
import Button from "../components/Button";
import Card from "../components/Card";
import Modal from "../components/Modal";
import { createBooking } from "../services/bookingService";

const initialForm = {
  facility: "Innovation Lab 2",
  date: "",
  time: "09:00 - 11:00",
  purpose: "",
};

function CreateBookingPage() {
  const [formData, setFormData] = useState(initialForm);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previousState) => ({
      ...previousState,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const booking = await createBooking(formData);
      setSuccessMessage(
        `Booking ${booking.id} submitted for ${booking.facility}. Status: ${booking.status}.`,
      );
      setFormData(initialForm);
      setIsModalOpen(false);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-stack">
      <Card
        actions={
          <Button onClick={() => setIsModalOpen(true)} variant="primary">
            Open Booking Form
          </Button>
        }
        subtitle="Create a new facility or asset reservation"
        title="Create Booking"
      >
        <p className="supporting-text">
          Use the booking form modal to request rooms, labs, or portable assets for
          campus activities.
        </p>
        {successMessage ? <p className="alert alert-success">{successMessage}</p> : null}
        {error ? <p className="alert alert-error">{error}</p> : null}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New Booking Request"
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="field">
            <span>Facility</span>
            <select name="facility" onChange={handleChange} value={formData.facility}>
              <option>Innovation Lab 2</option>
              <option>Main Auditorium</option>
              <option>Seminar Room C</option>
            </select>
          </label>

          <label className="field">
            <span>Date</span>
            <input
              name="date"
              onChange={handleChange}
              required
              type="date"
              value={formData.date}
            />
          </label>

          <label className="field">
            <span>Time Slot</span>
            <select name="time" onChange={handleChange} value={formData.time}>
              <option>09:00 - 11:00</option>
              <option>11:30 - 13:00</option>
              <option>14:00 - 16:00</option>
            </select>
          </label>

          <label className="field field-full">
            <span>Purpose</span>
            <textarea
              name="purpose"
              onChange={handleChange}
              placeholder="Describe the booking purpose"
              required
              rows="4"
              value={formData.purpose}
            />
          </label>

          <div className="modal-actions">
            <Button onClick={() => setIsModalOpen(false)} variant="secondary">
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default CreateBookingPage;

