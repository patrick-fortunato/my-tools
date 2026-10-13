namespace MyTools.Api.Services;

public interface ICSharpToJsonService
{
    object Convert(string csharpCode, bool includeTestValues);
}
