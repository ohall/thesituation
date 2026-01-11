import { NextRequest } from 'next/server';

// SSE endpoint for real-time incident updates
export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  
  let lastCheck = new Date();
  let intervalId: NodeJS.Timeout | null = null;
  
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const connectMessage = `data: ${JSON.stringify({ 
        type: 'connected', 
        timestamp: new Date().toISOString() 
      })}\n\n`;
      controller.enqueue(encoder.encode(connectMessage));
      
      // Poll for updates every 5 seconds
      intervalId = setInterval(async () => {
        try {
          // In production, query database for new incidents since lastCheck
          // For demo, just send a heartbeat
          const heartbeat = `data: ${JSON.stringify({ 
            type: 'heartbeat', 
            timestamp: new Date().toISOString(),
            lastCheck: lastCheck.toISOString()
          })}\n\n`;
          controller.enqueue(encoder.encode(heartbeat));
          
          // Simulate occasional new incidents (10% chance each poll)
          if (Math.random() < 0.1) {
            const mockUpdate = {
              type: 'incident',
              incident: {
                id: `demo-${Date.now()}`,
                sourceId: `demo-${Date.now()}`,
                sourceName: 'Demo Source',
                category: ['fire', 'police', 'traffic', 'transit'][Math.floor(Math.random() * 4)],
                severity: ['critical', 'high', 'moderate', 'low'][Math.floor(Math.random() * 4)],
                title: 'New incident detected',
                description: 'This is a simulated real-time update.',
                location: {
                  type: 'Point',
                  coordinates: [
                    -74.0 + (Math.random() - 0.5) * 0.2,
                    40.7 + (Math.random() - 0.5) * 0.1,
                  ],
                },
                locationText: 'NYC Metro Area',
                eventTime: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                confidence: 0.8 + Math.random() * 0.2,
                dedupeKey: `demo-${Date.now()}`,
              },
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(mockUpdate)}\n\n`));
          }
          
          lastCheck = new Date();
        } catch (error) {
          console.error('Error in SSE stream:', error);
        }
      }, 5000);
    },
    
    cancel() {
      if (intervalId) {
        clearInterval(intervalId);
      }
    },
  });
  
  // Handle client disconnect
  request.signal.addEventListener('abort', () => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}

