document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Participants section
        const participantsSection = document.createElement('div');
        participantsSection.className = 'participants-section';
        const participantsHeading = document.createElement('h5');
        participantsHeading.textContent = 'Participants';
        participantsSection.appendChild(participantsHeading);

        if (details.participants && details.participants.length > 0) {
          const ul = document.createElement('ul');
          ul.className = 'participants-list';

          details.participants.forEach((p) => {
            // derive a display string and initials
            let display = '';
            if (typeof p === 'string') display = p;
            else if (p.name) display = p.name;
            else if (p.email) display = p.email;
            else display = String(p);

            const initials = display
              .split(/\s+/)
              .map((s) => s[0])
              .filter(Boolean)
              .slice(0, 2)
              .join('')
              .toUpperCase();

            const li = document.createElement('li');
            li.className = 'participant-item';

            const avatar = document.createElement('div');
            avatar.className = 'participant-avatar';
            avatar.textContent = initials || '?';

            const text = document.createElement('span');
            text.textContent = display;

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'participant-delete-btn';
            deleteBtn.textContent = '×';
            deleteBtn.setAttribute('aria-label', `Remove ${display} from ${name}`);
            deleteBtn.addEventListener('click', async (e) => {
              e.preventDefault();
              try {
                const response = await fetch(
                  `/activities/${encodeURIComponent(name)}/unregister?email=${encodeURIComponent(display)}`,
                  {
                    method: "POST",
                  }
                );
                if (response.ok) {
                  fetchActivities();
                } else {
                  const error = await response.json();
                  alert(`Failed to remove participant: ${error.detail}`);
                }
              } catch (error) {
                alert('Failed to remove participant. Please try again.');
                console.error('Error removing participant:', error);
              }
            });

            li.appendChild(avatar);
            li.appendChild(text);
            li.appendChild(deleteBtn);
            ul.appendChild(li);
          });

          participantsSection.appendChild(ul);
        } else {
          const p = document.createElement('p');
          p.className = 'no-participants';
          p.textContent = 'No participants yet';
          participantsSection.appendChild(p);
        }

        activityCard.appendChild(participantsSection);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
