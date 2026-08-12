namespace ChatApp.Services;

// Implementação simples em disco local (wwwroot/uploads).
// Em produção, isto pode ser trocado por Azure Blob Storage / S3 sem alterar os controllers,
// pois estes dependem apenas da interface IFileStorageService.
public class FileStorageService : IFileStorageService
{
    private readonly IWebHostEnvironment _env;
    private readonly long _maxSizeBytes;

    public FileStorageService(IWebHostEnvironment env, IConfiguration config)
    {
        _env = env;
        var maxMb = config.GetValue<int?>("FileStorage:MaxFileSizeMb") ?? 50;
        _maxSizeBytes = maxMb * 1024L * 1024L;
    }

    public async Task<(string Url, string FileName, long Size)> SaveFileAsync(IFormFile file, string subFolder)
    {
        if (file.Length == 0)
            throw new ArgumentException("Ficheiro vazio.");

        if (file.Length > _maxSizeBytes)
            throw new InvalidOperationException($"Ficheiro excede o tamanho máximo permitido ({_maxSizeBytes / (1024 * 1024)} MB).");

        var uploadsRoot = Path.Combine(_env.WebRootPath, "uploads", subFolder);
        Directory.CreateDirectory(uploadsRoot);

        var safeExtension = Path.GetExtension(file.FileName);
        var storedFileName = $"{Guid.NewGuid():N}{safeExtension}";
        var fullPath = Path.Combine(uploadsRoot, storedFileName);

        await using (var stream = new FileStream(fullPath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var relativeUrl = $"/uploads/{subFolder}/{storedFileName}";
        return (relativeUrl, file.FileName, file.Length);
    }

    public void DeleteFile(string relativeUrl)
    {
        if (string.IsNullOrWhiteSpace(relativeUrl)) return;
        var path = Path.Combine(_env.WebRootPath, relativeUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
        if (File.Exists(path)) File.Delete(path);
    }
}
