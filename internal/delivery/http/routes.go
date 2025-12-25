package http

import (
	"github.com/gin-gonic/gin"
	"github.com/skryfon/collex/internal/delivery/http/middleware"
	"github.com/skryfon/collex/internal/infrastructure/container"
	"github.com/skryfon/collex/shared"
)

// SetupCleanRoutes configures all routes using clean architecture
func SetupCleanRoutes(router *gin.Engine, container *container.Container) {
	// Add CORS middleware first (before any routes)
	router.Use(middleware.CORS(container.Config))

	// Health check routes (no rate limiting)
	healthHandler := NewHealthHandler(container.Database)
	router.GET("/health", healthHandler.HealthCheck)
	router.GET("/ready", healthHandler.ReadinessCheck)
	router.GET("/live", healthHandler.LivenessCheck)
	router.GET("/health/detailed", healthHandler.DetailedHealthCheck)
	router.GET("/health/database", healthHandler.DatabaseHealthCheck)
	router.GET("/metrics", healthHandler.Metrics)

	// API routes with rate limiting
	api := router.Group("/api")
	api.Use(middleware.GlobalRateLimit(1000)) // Global rate limit of 1000 requests per minute

	// Create handlers using the container (avoiding import cycle)
	authHandler := NewAuthHandlerClean(
		container.AuthUseCase,
		container.AuditLogRepository,
		container.SecurityRepository,
	)

	// User handler for user-related operations
	userHandler := NewUserHandlerClean(
		container.UserUseCase,
	)
	medicineHanler := NewMedicineHandlerClean(
		container.MedicineUseCase,
		container.UserRepository,
	)
	doctorHanler := NewDoctorHandlerClean(
		container.DoctorUseCase,
	)
	orderHandler := NewOrderHandlerClean(
		container.OrderUsecase,
		container.PaymentUseCase,
	)
	paymentHandler := NewPaymentHandlerClean(
		container.PaymentUseCase,
		container.UserRepository,
	)
	appoinmentHandler := NewAppoinmentHandlerClean(
		container.AppoinmentUseCase,
		container.UserRepository,
	)

	// Authentication routes (public)
	authRoutes := api.Group("/auth")
	{
		authRoutes.POST("/login", authHandler.Login)
		authRoutes.POST("/register", userHandler.CreateUser)
		authRoutes.POST("/refresh", authHandler.RefreshToken)
		authRoutes.GET("/roles", userHandler.FetchRoles)
		authRoutes.GET("/validate", authHandler.ValidateToken)
		authRoutes.POST("/forgot-password", authHandler.ForgotPassword)
		authRoutes.POST("/reset-password", authHandler.ResetPassword)
	}

	// Protected routes (require authentication)
	protectedRoutes := api.Group("/")
	protectedRoutes.Use(middleware.JWTAuth(container.TokenService))
	{
		// User profile and account management routes (authenticated users)
		patientRoutes := protectedRoutes.Group("/user")
		{
			patientRoutes.GET("/medicines", medicineHanler.GetMedicines)
			patientRoutes.POST("/doctors", doctorHanler.GetDoctors)
			patientRoutes.POST("/medicines", medicineHanler.GetMedicines)
			patientRoutes.PUT("/update-cart", orderHandler.UpdateCart)
			patientRoutes.POST("/add-cart", orderHandler.AddToCart)
			patientRoutes.GET("/view-cart", orderHandler.GetCart)
			patientRoutes.DELETE("/remove-cart", orderHandler.RemoveFromCart)

			patientRoutes.POST("/book-appointment", appoinmentHandler.BookAppointment)
			patientRoutes.GET("/confirmed-appiontment-slot", appoinmentHandler.ConfirmedAppionmentSlot)

			patientRoutes.GET("/consultations", appoinmentHandler.FetchPatientConsultations)

			patientRoutes.GET("/profile", userHandler.GetUserProfile)
			patientRoutes.PUT("/profile", userHandler.UpdateUserProfile)
			patientRoutes.POST("/change-password", authHandler.ChangePassword)

			// Option 1: Orders under /user/orders
			orderRoutes := patientRoutes.Group("/orders")
			{
				orderRoutes.GET("", orderHandler.GetUserOrders)    // /user/orders
				orderRoutes.GET("/:id", orderHandler.GetOrderByID) // /user/orders/:id
			}
		}
		//User Order Routed

		pharmacyRoutes := protectedRoutes.Group("/pharmacy")
		{
			pharmacyRoutes.POST("/add-medicine", medicineHanler.AddMedicine)
			pharmacyRoutes.GET("/list-medicine", medicineHanler.ListMedicines)
			pharmacyRoutes.PUT("/update-medicine/:id", medicineHanler.UpdateMedicine)
			pharmacyRoutes.GET("/get-medicine/:id", medicineHanler.GetMedicineByID)
			pharmacyRoutes.DELETE("/delete-medicine/:id", medicineHanler.DeleteMedicine)

			pharmacyRoutes.GET("/orders", orderHandler.GetPharmacyOrders)
			pharmacyRoutes.PUT("/orders/:id", orderHandler.UpdateOrderStatus)
			pharmacyRoutes.GET("/orders/revenue", orderHandler.GetTotalRevenue)

			/*
				pharmacyRoutes.GET("/orders/:id", orderHandler.GetOrderByID)
				pharmacyRoutes.PUT("/orders/:id", orderHandler.UpdateOrderStatus)*/

		}

		paymentRoutes := protectedRoutes.Group("/payment")
		{
			paymentRoutes.POST("/create-order", paymentHandler.CreateOrder)
			paymentRoutes.POST("/verify", paymentHandler.VerifyPayment)
			paymentRoutes.GET("/status/:orderId", paymentHandler.GetPaymentStatus)
			paymentRoutes.GET("/history", paymentHandler.GetUserPayments)
		}
		doctorRoutes := protectedRoutes.Group("/doctor")
		{
			doctorRoutes.GET("/schedule", appoinmentHandler.GetDoctorSchedule)
			doctorRoutes.POST("/schedule-appointment", appoinmentHandler.ScheduleAppointment)
			doctorRoutes.GET("/consultations", appoinmentHandler.FetchConsultations)
			doctorRoutes.DELETE("/cancel-appointment", appoinmentHandler.CancelAppointment)

		}
		// Admin routes (require authentication + admin role)
		adminRoutes := protectedRoutes.Group("/admin")
		//	adminRoutes.Use(middleware.RoleBasedAccess(string(shared.UserRoleAdmin), string(shared.UserRoleSuperAdmin)))
		{
			// User management routes (admin only)
			adminUserRoutes := adminRoutes.Group("/users")
			{
				//adminUserRoutes.GET("/roles", userHandler.FetchRoles)
				adminUserRoutes.GET("/", userHandler.ListUsers)
				//adminUserRoutes.GET("/:id", userHandler.GetUserByID)         // Get specific user by ID
				adminUserRoutes.PUT("/update-user/:id", userHandler.UpdateUser) // Changed from update/:id to standard REST
				adminUserRoutes.GET("/:id/profile", userHandler.UserProfile)    // Get user profile by ID

				// Apply SuperAdmin middleware only to this specific route
				adminUserRoutes.POST("/:id/status",
					middleware.RoleBasedAccess(string(shared.UserRoleSuperAdmin)),
					userHandler.UpdateUserStatus)
			}
		}
	}
}

// SetupRoutesWithContainer is a convenience function that creates both container and routes
// This is kept for future extensibility but currently unused
