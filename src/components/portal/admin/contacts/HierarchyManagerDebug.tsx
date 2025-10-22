import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function HierarchyManagerDebug() {
  const [clickCount, setClickCount] = useState(0);
  
  console.log('HierarchyManagerDebug rendered, clickCount:', clickCount);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Debug Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>Click count: {clickCount}</p>
        <Button 
          onClick={() => {
            console.log('Button clicked!');
            setClickCount(prev => prev + 1);
          }}
        >
          Test Click (Count: {clickCount})
        </Button>
        
        <div 
          className="p-4 border rounded cursor-pointer hover:bg-gray-50"
          onClick={() => {
            console.log('Div clicked!');
            alert('Div was clicked!');
          }}
        >
          Click this div to test
        </div>
        
        <input 
          type="text" 
          placeholder="Type here to test input"
          onChange={(e) => console.log('Input changed:', e.target.value)}
          className="w-full p-2 border rounded"
        />
      </CardContent>
    </Card>
  );
}