function Button({ text, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        padding: "10px",
        backgroundColor: "#4f46e5",
        color: "white",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
      }}
    >
      {text}
    </button>
  );
}

export default Button;
