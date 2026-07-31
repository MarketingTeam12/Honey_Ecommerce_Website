
import { useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../utils/api";

function AdminUpload() {
  const [email, setEmail] = useState("");
  const [file, setFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();

    formData.append("email", email);
    formData.append("document", file);

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/send-document`,
        formData
      );

      alert("Document Sent Successfully");
    } catch (error) {
      console.log(error);
      alert("Failed");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Customer Email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <br />
      <br />

      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <br />
      <br />

      <button type="submit">
        Send Document
      </button>
    </form>
  );
}

export default AdminUpload;

