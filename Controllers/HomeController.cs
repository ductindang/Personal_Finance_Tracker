using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using PersonalFinanceTracker.Models;

namespace PersonalFinanceTracker.Controllers;

[Authorize]
public class HomeController : Controller
{
    public IActionResult Index() => View();
    public IActionResult Transactions() => View();
    public IActionResult Budgets() => View();
    public IActionResult Savings() => View();
    public IActionResult Settings() => View();

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }
}
