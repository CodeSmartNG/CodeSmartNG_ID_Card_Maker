// ... existing imports
const CardDesigner = lazy(() => import('../pages/CardDesigner'));
const CardPayment = lazy(() => import('../pages/CardPayment')); // <-- ADD THIS
const PaymentSuccess = lazy(() => import('../pages/PaymentSuccess'));
// ...

export const router = createBrowserRouter([
  { path: '/', element: wrap(<Home />) },
  { path: '/login', element: wrap(<Login />) },
  { path: '/register', element: wrap(<Register />) },
  { path: '/payment/success', element: wrap(<PaymentSuccess />) },
  { 
    element: <ProtectedRoute />,
    children: [
      { path: '/dashboard', element: wrap(<Dashboard />) },
      { path: '/members', element: wrap(<Members />) },
      { path: '/members/new', element: wrap(<AddMember />) },
      { path: '/members/:id/edit', element: wrap(<EditMember />) },
      { path: '/cards/new', element: wrap(<CardDesigner />) },
      { path: '/cards/pay/:cardId', element: wrap(<CardPayment />) }, // <-- ADD THIS ROUTE
    ]
  },
  { path: '*', element: wrap(<NotFound />) },
]);
