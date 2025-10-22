export function SimpleTest() {
  console.log('[SimpleTest] Component rendered!');

  return (
    <div style={{
      backgroundColor: 'red',
      color: 'white',
      padding: '50px',
      fontSize: '24px',
      minHeight: '100vh'
    }}>
      <h1>TEST PAGE IS WORKING!</h1>
      <p>If you can see this, the routing is working.</p>
    </div>
  );
}

export default SimpleTest;