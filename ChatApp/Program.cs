using ChatApp.Data;
using ChatApp.Hubs;
using ChatApp.Models;
using ChatApp.Services;
using ChatApp.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// ============================================================
// BASE DE DADOS — SQL SERVER
// ============================================================
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")
    )
);

// ============================================================
// IDENTITY — CONTAS, AUTENTICAÇÃO E AUTORIZAÇÃO
// ============================================================
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.Password.RequiredLength = 6;
    options.Password.RequireNonAlphanumeric = false;

    options.User.RequireUniqueEmail = true;

    // Ativar em produção quando o envio de e-mail estiver configurado.
    options.SignIn.RequireConfirmedAccount = false;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// ============================================================
// COOKIE DE AUTENTICAÇÃO
// ============================================================
builder.Services.ConfigureApplicationCookie(options =>
{
    options.LoginPath = "/Account/Login";
    options.LogoutPath = "/Account/Logout";
    options.AccessDeniedPath = "/Account/Login";

    options.ExpireTimeSpan = TimeSpan.FromDays(14);
    options.SlidingExpiration = true;

    // Faz o cookie de autenticação funcionar
    // corretamente com os Hubs SignalR.
    options.Events.OnRedirectToLogin = context =>
    {
        if (context.Request.Path.StartsWithSegments("/hubs"))
        {
            context.Response.StatusCode =
                StatusCodes.Status401Unauthorized;

            return Task.CompletedTask;
        }

        context.Response.Redirect(context.RedirectUri);

        return Task.CompletedTask;
    };
});

// ============================================================
// MVC + SIGNALR
// ============================================================
builder.Services.AddControllersWithViews();

builder.Services.AddSignalR();

// ============================================================
// INJEÇÃO DE DEPENDÊNCIA — SERVIÇOS DA APLICAÇÃO
// ============================================================

builder.Services.AddHttpContextAccessor();

builder.Services.AddScoped<IFileStorageService, FileStorageService>();

builder.Services.AddScoped<INotificationService, NotificationService>();

builder.Services.AddScoped<IChannelService, ChannelService>();

builder.Services.AddScoped<IPostService, PostService>();

builder.Services.AddScoped<IChannelInviteService, ChannelInviteService>();

// Serviço responsável por aplicar as regras de privacidade
// definidas pelo utilizador.
builder.Services.AddScoped<IPrivacyService, PrivacyService>();

// ============================================================
// CONSTRUÇÃO DA APLICAÇÃO
// ============================================================
var app = builder.Build();

// ============================================================
// PIPELINE DE PRODUÇÃO
// ============================================================
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");

    app.UseHsts();
}

// ============================================================
// HTTPS
// ============================================================
app.UseHttpsRedirection();

// ============================================================
// FICHEIROS ESTÁTICOS
// ============================================================
app.UseStaticFiles();

// ============================================================
// ROUTING
// ============================================================
app.UseRouting();

// ============================================================
// AUTENTICAÇÃO
// ============================================================
app.UseAuthentication();

// ============================================================
// AUTORIZAÇÃO
// ============================================================
app.UseAuthorization();

// ============================================================
// ROTA MVC PRINCIPAL
// ============================================================
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Account}/{action=Login}/{id?}"
);

// ============================================================
// SIGNALR — CHAT
// ============================================================
app.MapHub<ChatHub>("/hubs/chat");

// ============================================================
// SIGNALR — CHAMADAS
// ============================================================
app.MapHub<CallHub>("/hubs/call");

// ============================================================
// INICIAR A APLICAÇÃO
// ============================================================
app.Run();
