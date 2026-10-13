using System.ComponentModel.DataAnnotations;

namespace MyTools.Api.Models;

public class CSharpToJsonRequest
{
    [Required]
    [StringLength(100_000, ErrorMessage = "Input exceeds maximum length of 100,000 characters.")]
    public string CSharpCode { get; set; } = string.Empty;

    public bool IncludeTestValues { get; set; }
}
