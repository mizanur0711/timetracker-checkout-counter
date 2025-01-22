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
          const spanPresent = document.querySelectorAll("span.pull-right");
          const rows = document.querySelectorAll("table.table tbody tr, tbody.word-break tr");
          let checkoutCount = 0;
          let presentCount = 0;
          
          if (rows.length === 0) {
            return { checkoutCount, presentCount };
          }

          if (spanPresent) {
            const spanText = spanPresent[0].textContent.trim();
            const match = spanText.match(/Total present today:\s*(\d+)/);
            presentCount = match ? parseInt(match[1]) : null; 
          }

          
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

          // Return both values as an object
          return { checkoutCount, presentCount };
        }
      },
      (results) => {
        if (chrome.runtime.lastError) {
          updateCountDisplay('Error', 'Error');
          return;
        }
        
        if (results && results[0] && results[0].result) {
          updateCountDisplay(results[0].result.checkoutCount, results[0].result.presentCount);
        } else {
          updateCountDisplay('N/A', 'N/A');
        }
      }
    );
  });
}

function updateCountDisplay(checkoutCount, presentCount) {
  const countElement = document.getElementById('count');
  const presentCountElement = document.getElementById('presentCount');
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');

  if (countElement) {
    countElement.innerText = checkoutCount;
  }
  if (presentCountElement) {
    presentCountElement.innerText = presentCount;
  }

  // Calculate and update progress
  if (progressFill && progressText && presentCount && checkoutCount) {
    const total = parseInt(presentCount) + parseInt(checkoutCount);
    const percentage = total > 0 ? Math.round((checkoutCount / total) * 100) : 0;
    progressFill.style.width = `${percentage}%`;
    progressText.innerText = `${percentage}%`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  countCheckouts();
  
  const refreshButton = document.getElementById('refresh');
  if (refreshButton) {
    refreshButton.addEventListener('click', countCheckouts);
  }
});