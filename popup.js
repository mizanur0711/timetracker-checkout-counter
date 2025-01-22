function countCheckouts() {
  if (!chrome.tabs) {
    return;
  }

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs[0]) {
      return;
    }

    chrome.scripting.executeScript(
      {
        target: { tabId: tabs[0].id },
        func: () => {
          const rows = document.querySelectorAll("table.table tbody tr, tbody.word-break tr");
          
          if (rows.length === 0) {
            return 0;
          }

          let checkoutCount = 0;
          
          rows.forEach((row, index) => {
            try {
              const outTimeCell = row.cells[3];
              if (!outTimeCell) {
                return;
              }

              const outTime = outTimeCell.innerText.trim();

              if (outTime !== '-' && 
                  outTime !== '' && 
                  /^(0?[1-9]|1[0-2]):[0-5][0-9]\s*(AM|PM)$/i.test(outTime)) {
                checkoutCount++;
              }
            } catch (err) {
              return;
            }
          });

          return checkoutCount;
        }
      },
      (results) => {
        if (chrome.runtime.lastError) {
          updateCountDisplay('Error');
          return;
        }
        
        if (results && results[0] && typeof results[0].result === 'number') {
          updateCountDisplay(results[0].result);
        } else {
          updateCountDisplay('N/A');
        }
      }
    );
  });
}

function updateCountDisplay(value) {
  const countElement = document.getElementById('count');
  if (countElement) {
    countElement.innerText = value;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  countCheckouts();
  
  const refreshButton = document.getElementById('refresh');
  if (refreshButton) {
    refreshButton.addEventListener('click', countCheckouts);
  }
});