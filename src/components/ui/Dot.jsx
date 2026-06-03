export default function Dot({ color = "#64748b", size = 8 }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        boxShadow: `0 0 12px ${color}`,
        flex: "0 0 auto",
      }}
    />
  );
}
