namespace ChatApp.Services;

public interface IFileStorageService
{
    // Guarda o ficheiro numa subpasta (ex: "photos", "files", "audio") e devolve a URL relativa
    Task<(string Url, string FileName, long Size)> SaveFileAsync(IFormFile file, string subFolder);
    void DeleteFile(string relativeUrl);
}
