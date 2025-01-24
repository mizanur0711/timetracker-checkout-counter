const prepareData = () => {
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

    return { checkoutCount, presentCount };   
}

const getInTime = () => {
    const alertInfo = document.querySelector('.alert.alert-info');
    if (alertInfo) {
        const boldText = alertInfo.querySelector('b');
        if (boldText) {
            return boldText.textContent.trim();
        }
    }
    return null;
}

const calculateDuration = (inTimeStr) => {
    if (!inTimeStr) return null;
    
    const [time, period] = inTimeStr.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    
    let inTimeHours = hours;
    if (period.toUpperCase() === 'PM' && hours !== 12) {
        inTimeHours += 12;
    } else if (period.toUpperCase() === 'AM' && hours === 12) {
        inTimeHours = 0;
    }

    const now = new Date();
    const inTime = new Date(now);
    inTime.setHours(inTimeHours, minutes, 0, 0);

    const diffMinutes = Math.floor((now - inTime) / (1000 * 60));
    
    const hours_stayed = Math.floor(diffMinutes / 60);
    const minutes_stayed = diffMinutes % 60;

    return `${hours_stayed}h ${minutes_stayed}m`;
}

const changePerntage = (checkoutCount, presentCount) => {
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');

    if (progressFill && progressText && presentCount && checkoutCount) {
        const total = parseInt(presentCount) + parseInt(checkoutCount);
        const percentage = total > 0 ? Math.round((checkoutCount / total) * 100) : 0;
        progressFill.style.width = `${percentage}%`;
        progressText.innerText = `${percentage}%`;
      }
}

const initializeSummary = () => {
    // Check if we're on the Timetracker table page
    const logStatusDiv = document.querySelector('.log-status');
    if (!logStatusDiv) return;  

    const data = prepareData();
    const inTime = getInTime();
    let duration = calculateDuration(inTime);

    const htmlToInject = `
        <div class="panel-heading">
            <b>Today's Summary</b>
        </div>
        <table class="table table-bordered table-hover">
            <colgroup>
                <col style="width: 50%;">
                <col style="width: 50%;">
            </colgroup>
            <tbody>
                <tr>
                    <td>You stayed for</td>
                    <td id="duration-display">${duration || 'Not available'}</td>
                </tr>
                <tr>
                    <td>Present Today</td>
                    <td>${data.presentCount}</td>
                </tr>
                <tr>
                    <td>Checked Out</td>
                    <td>${data.checkoutCount}</td>
                </tr>
                <tr>
                    <td>Checkout Percentage</td>
                    <td>
                        <div style="height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; margin: 6px 0;">
                            <div id="progress-fill" style="height: 100%; background: linear-gradient(to right, #eb4325, #a38e16); width: 0%; transition: width 0.3s ease-in-out;"></div>
                        </div>
                        <div id="progress-text" style="text-align: center; font-size: 12px; color: #6b7280;">0%</div>
                    </td>
                </tr>
            </tbody>
        </table>
    `;

    // Create a container for the injected HTML
    const container = document.createElement('div');
    container.classList.add('panel', 'panel-default');
    container.innerHTML = htmlToInject;

    const targetElement = document.evaluate(
        '/html/body/div[1]/div/div[2]/div[2]',
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
    ).singleNodeValue;

    if (targetElement) {
        // Insert before the first child of target element
        if (targetElement.firstChild) {
            targetElement.insertBefore(container, targetElement.firstChild);
        } else {
            targetElement.appendChild(container);
        }
        changePerntage(data.checkoutCount, data.presentCount);
    }
}

if (window.location.href.includes('timetracker.nascenia.com')) {
    initializeSummary();
}
