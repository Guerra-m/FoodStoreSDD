#!/bin/bash

echo "🚀 Iniciando FoodStore..."

# Backend
echo "📦 Backend iniciando en puerto 8000..."
(
  cd /home/noguedev/FoodStoreSDD/backend
  source venv/bin/activate
  python -m uvicorn main:app --host 127.0.0.1 --port 8000 --no-access-log
) &
BACKEND_PID=$!

# Frontend
echo "📱 Frontend iniciando en puerto 5173..."
(
  cd /home/noguedev/FoodStoreSDD/frontend
  npm run dev
) &
FRONTEND_PID=$!

echo ""
echo "✅ Backend PID: $BACKEND_PID"
echo "✅ Frontend PID: $FRONTEND_PID"
echo ""
echo "URLs:"
echo "  Backend:  http://localhost:8000"
echo "  Frontend: http://localhost:5173"
echo "  Health:   http://localhost:8000/health"
echo ""
echo "Para detener: kill $BACKEND_PID $FRONTEND_PID"
echo ""
wait
