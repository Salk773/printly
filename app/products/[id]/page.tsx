export default function Test({ params }: any) {
  return (
    <div style={{ fontSize: "2rem", padding: 40 }}>
      <p>TEST PAGE LOADED</p>
      <p>ID: {params.id}</p>
    </div>
  );
}
