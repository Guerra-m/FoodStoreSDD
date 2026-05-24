#!/bin/bash

echo "🚀 Iniciando FoodStore..."

# Backend
cd /home/noguedev/FoodStoreSDD/backend
source venv/bin/activate
echo "📦 Backend iniciando en puerto 8000..."
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

# Frontend
cd /home/noguedev/FoodStoreSDD/frontend
echo "📱 Frontend iniciando en puerto 5173..."
npm run dev &
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
