document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    
    if (!token) {
        window.location.href = "/login";
        return;
    }
    
    console.log("Petit Transporteur validé ");
   
});