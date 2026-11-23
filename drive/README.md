# Save Bike Check reports to Google Drive

Do this once, on a computer if possible (it's easier than on the iPad).

1. Go to https://script.google.com and click **New project**. Name it **Bike Check Drive**.
2. Delete what's in the editor, paste in all of `SaveToDrive.gs`, and click **Save**.
3. Choose **setup** in the function menu at the top and click **Run**. Allow access to your Google Drive when asked.
   This makes the **Bike Checks** folder in your Drive.
4. Click **Deploy > New deployment**. Click the gear and pick **Web app**. Set:
   - Execute as: **Me**
   - Who has access: **Anyone**

   Click **Deploy**.
5. Choose **showAppLink** in the function menu and click **Run**. Copy the link from the log at the bottom.
   It looks like `https://script.google.com/macros/s/…/exec?key=…`.
6. Send that link to the iPad (for example in a note or email to yourself), copy it there, open Bike Check,
   tap **Connect Google Drive** on the home screen and paste it.

After that, **Download checks report** saves straight into Drive > Bike Checks. Saving again on the same day
replaces that day's file. If the iPad is offline, the app offers the share sheet instead.

Keep the link private: anyone who has it can add files to your Bike Checks folder. If it leaks, open the script,
go to **Project Settings > Script properties**, delete `KEY`, run **setup** and **showAppLink** again, and paste the
new link into the app.
