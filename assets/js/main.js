// #########################################################

function copiedLink() {
  navigator.clipboard
    .writeText(window.location.href)
    .then(() => alert("Link disalin!"));
}

// #########################################################
