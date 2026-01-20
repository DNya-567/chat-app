function Input({ type = "text", placeholder, value, onChange }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      style={{
        width: "100%",
        padding: "10px",
        marginBottom: "12px",
        borderRadius: "5px",
        border: "1px solid #ccc",
      }}
    />
  );
}

export default Input;
