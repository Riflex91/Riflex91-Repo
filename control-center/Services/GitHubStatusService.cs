using System.Net.Http.Headers;
using System.Text.Json;

namespace AioBotControlCenter.Services;

public sealed class GitHubStatusService(HttpClient httpClient)
{
    public async Task<(string Commit, string State)> ReadMainAsync(ControlCenterConfig config, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(config.GitHubRepository))
            return ("not configured", "OFFLINE");

        using var request = new HttpRequestMessage(HttpMethod.Get,
            $"https://api.github.com/repos/{config.GitHubRepository}/commits/main");
        request.Headers.UserAgent.ParseAdd("AioBotControlCenter/0.1");
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/vnd.github+json"));
        if (!string.IsNullOrWhiteSpace(config.GitHubToken))
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", config.GitHubToken);

        using var response = await httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
            return ($"HTTP {(int)response.StatusCode}", "DEGRADED");

        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var json = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
        var sha = json.RootElement.GetProperty("sha").GetString() ?? "unknown";
        return (sha.Length > 10 ? sha[..10] : sha, "HEALTHY");
    }
}
