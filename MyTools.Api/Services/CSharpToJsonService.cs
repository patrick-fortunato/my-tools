using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;

namespace MyTools.Api.Services;

public class CSharpToJsonService : ICSharpToJsonService
{
    private static readonly string[] GenericCollectionPatterns =
    [
        "List<", "IList<", "IEnumerable<", "ICollection<",
        "IReadOnlyList<", "IReadOnlyCollection<", "HashSet<"
    ];

    public object Convert(string csharpCode, bool includeTestValues)
    {
        var context = new ConversionContext();

        var tree = CSharpSyntaxTree.ParseText(csharpCode);
        var root = tree.GetRoot();

        var classes = root.DescendantNodes()
            .OfType<ClassDeclarationSyntax>()
            .ToList();

        if (classes.Count == 0)
            throw new InvalidOperationException("No C# classes found in the input.");

        var rootClass = classes[0];
        var classMap = classes.ToDictionary(c => c.Identifier.Text, c => c);

        return BuildJsonObject(rootClass, classMap, includeTestValues, new HashSet<string>(), context);
    }

    private Dictionary<string, object?> BuildJsonObject(
        ClassDeclarationSyntax classDecl,
        Dictionary<string, ClassDeclarationSyntax> classMap,
        bool includeTestValues,
        HashSet<string> visited,
        ConversionContext context)
    {
        var result = new Dictionary<string, object?>();
        var className = classDecl.Identifier.Text;

        if (!visited.Add(className))
            return result;

        var properties = classDecl.Members
            .OfType<PropertyDeclarationSyntax>()
            .Where(p => p.AccessorList?.Accessors.Any(a => a.IsKind(SyntaxKind.GetAccessorDeclaration)) == true);

        foreach (var prop in properties)
        {
            var propName = GetJsonPropertyName(prop);
            var typeName = prop.Type.ToString();
            var value = GetDefaultValue(typeName, classMap, includeTestValues, visited, propName, context);
            result[propName] = value;
        }

        visited.Remove(className);
        return result;
    }

    private static string GetJsonPropertyName(PropertyDeclarationSyntax prop)
    {
        foreach (var attrList in prop.AttributeLists)
        {
            foreach (var attr in attrList.Attributes)
            {
                var name = attr.Name.ToString();
                if (name is "JsonPropertyName" or "System.Text.Json.Serialization.JsonPropertyName")
                {
                    var arg = attr.ArgumentList?.Arguments.FirstOrDefault();
                    if (arg != null)
                    {
                        var expression = arg.Expression.ToString().Trim('"');
                        return expression;
                    }
                }
            }
        }

        var propName = prop.Identifier.Text;
        return char.ToLowerInvariant(propName[0]) + propName[1..];
    }

    private object? GetDefaultValue(
        string typeName,
        Dictionary<string, ClassDeclarationSyntax> classMap,
        bool includeTestValues,
        HashSet<string> visited,
        string propertyName,
        ConversionContext context)
    {
        var isNullable = typeName.EndsWith('?');
        var baseType = isNullable ? typeName[..^1] : typeName;

        if (IsCollectionType(baseType, out var elementType))
        {
            var item = GetDefaultValue(elementType, classMap, includeTestValues, visited, propertyName, context);
            return new List<object?> { item };
        }

        if (baseType.EndsWith("[]"))
        {
            var elementTypeName = baseType[..^2];
            var item = GetDefaultValue(elementTypeName, classMap, includeTestValues, visited, propertyName, context);
            return new List<object?> { item };
        }

        if (classMap.TryGetValue(baseType, out var nestedClass))
        {
            return BuildJsonObject(nestedClass, classMap, includeTestValues, visited, context);
        }

        return GetPrimitiveDefault(baseType, includeTestValues, propertyName, context);
    }

    private static object? GetPrimitiveDefault(string typeName, bool includeTestValues, string propertyName, ConversionContext context)
    {
        return typeName.ToLowerInvariant() switch
        {
            "string" => includeTestValues ? GetTestString(propertyName, context) : "",
            "int" or "int32" or "system.int32" => includeTestValues ? ++context.IntCounter : 0,
            "long" or "int64" or "system.int64" => includeTestValues ? (long)(++context.IntCounter * 1000) : 0L,
            "short" or "int16" or "system.int16" => includeTestValues ? (short)(++context.IntCounter) : (short)0,
            "float" or "single" or "system.single" => includeTestValues ? (float)(++context.DoubleCounter * 1.5) : 0f,
            "double" or "system.double" => includeTestValues ? ++context.DoubleCounter * 1.5 : 0.0,
            "decimal" or "system.decimal" => includeTestValues ? ++context.DoubleCounter * 10.99m : 0m,
            "bool" or "boolean" or "system.boolean" => includeTestValues,
            "datetime" or "system.datetime" => includeTestValues ? "2025-01-15T10:30:00Z" : "",
            "datetimeoffset" or "system.datetimeoffset" => includeTestValues ? "2025-01-15T10:30:00+00:00" : "",
            "dateonly" or "system.dateonly" => includeTestValues ? "2025-01-15" : "",
            "timeonly" or "system.timeonly" => includeTestValues ? "10:30:00" : "",
            "guid" or "system.guid" => includeTestValues ? "a1b2c3d4-e5f6-7890-abcd-ef1234567890" : "",
            "byte" or "system.byte" => includeTestValues ? (byte)255 : (byte)0,
            "char" or "system.char" => includeTestValues ? "A" : "",
            "object" or "system.object" => new Dictionary<string, object?>(),
            _ => null
        };
    }

    private static string GetTestString(string propertyName, ConversionContext context)
    {
        context.StringCounter++;
        var counter = context.StringCounter;
        var lower = propertyName.ToLowerInvariant();

        if (lower.Contains("name")) return $"Sample Name {counter}";
        if (lower.Contains("email")) return $"test{counter}@example.com";
        if (lower.Contains("url") || lower.Contains("uri")) return $"https://example.com/{counter}";
        if (lower.Contains("phone")) return $"555-010{counter:D4}";
        if (lower.Contains("address")) return $"123 Test St #{counter}";
        if (lower.Contains("city")) return "Portland";
        if (lower.Contains("state")) return "OR";
        if (lower.Contains("zip") || lower.Contains("postal")) return "97201";
        if (lower.Contains("country")) return "US";
        if (lower.Contains("description") || lower.Contains("summary")) return $"Sample description {counter}";
        if (lower.Contains("title")) return $"Sample Title {counter}";
        if (lower.Contains("id")) return $"id-{counter:D4}";
        return $"sample-{counter}";
    }

    private static bool IsCollectionType(string typeName, out string elementType)
    {
        elementType = string.Empty;

        foreach (var pattern in GenericCollectionPatterns)
        {
            if (typeName.StartsWith(pattern, StringComparison.OrdinalIgnoreCase) && typeName.EndsWith(">"))
            {
                elementType = typeName[pattern.Length..^1];
                return true;
            }
        }

        return false;
    }

    /// <summary>
    /// Thread-local context for a single conversion operation.
    /// Avoids mutable instance state on the service.
    /// </summary>
    private sealed class ConversionContext
    {
        public int StringCounter { get; set; }
        public int IntCounter { get; set; }
        public int DoubleCounter { get; set; }
    }
}
