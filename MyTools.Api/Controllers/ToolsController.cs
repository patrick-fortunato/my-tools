using Microsoft.AspNetCore.Mvc;
using MyTools.Api.Models;
using MyTools.Api.Services;

namespace MyTools.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ToolsController : ControllerBase
{
    private readonly ICSharpToJsonService _csharpToJsonService;
    private readonly ILogger<ToolsController> _logger;

    public ToolsController(ICSharpToJsonService csharpToJsonService, ILogger<ToolsController> logger)
    {
        _csharpToJsonService = csharpToJsonService;
        _logger = logger;
    }

    [HttpPost("csharp-to-json")]
    [ProducesResponseType(typeof(CSharpToJsonResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public IActionResult CSharpToJson([FromBody] CSharpToJsonRequest request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            cancellationToken.ThrowIfCancellationRequested();
            var result = _csharpToJsonService.Convert(request.CSharpCode, request.IncludeTestValues);
            return Ok(new CSharpToJsonResponse { Result = result });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid C# input provided for conversion");
            return BadRequest(new CSharpToJsonResponse { Error = ex.Message });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid argument in C# conversion request");
            return BadRequest(new CSharpToJsonResponse { Error = ex.Message });
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("C# to JSON request was cancelled");
            return StatusCode(StatusCodes.Status499ClientClosedRequest);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during C# to JSON conversion");
            return StatusCode(StatusCodes.Status500InternalServerError,
                new CSharpToJsonResponse { Error = "An unexpected error occurred." });
        }
    }
}
