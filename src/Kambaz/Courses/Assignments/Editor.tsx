export default function AssignmentEditor() {
    return (
<div id="wd-assignments-editor">
      <label htmlFor="wd-name">Assignment Name</label>
      <input id="wd-name" value="A1 - ENV + HTML" /><br /><br />
      <textarea id="wd-description">
        The assignment is available online Submit a link to the landing page of
      </textarea>
      <br />
      <table>
        <tr>
          <td align="right" valign="top">
            <label htmlFor="wd-points">Points</label>
          </td>
          <td>
            <input id="wd-points" value={100} />
          </td>
        </tr>
        {/* Complete on your own */}
        <tr>
          <td align="right" valign="top">
            <label htmlFor="wd-group">Assignment Group</label>
          </td>
          <td>
            <select id="wd-group">
              <option>Assignments</option>
              <option>Quizzes</option>
              <option>Exams</option>
              <option>Projects</option>
            </select>
          </td>
        </tr>
       
        <tr>
          <td align="right" valign="top">
            <label htmlFor="wd-display-grade-as">Display Grade as</label>
          </td>
          <td>
            <select id="wd-display-grade-as">
              <option>Percentage</option>
              <option>Letter</option>
            </select>
          </td>
        </tr>

        <tr>
          <td align="right" valign="top">
            <label htmlFor="wd-submission-type">Submission Type</label>
          </td>
          <td>
            <select id="wd-submission-type">
              <option>Online</option>
              <option>On Paper</option>
            </select>
          </td>
        </tr>


        <tr>
          <td align="right" valign="top">
            <label>Online Entry Options</label>
          </td>
          <td>
            <div>
              <input type="checkbox" id="wd-text-entry" />
              <label htmlFor="wd-text-entry">Text Entry</label>
            </div>
            <div>
              <input type="checkbox" id="wd-website-url" />
              <label htmlFor="wd-website-url">Website URL</label>
            </div>
            <div>
              <input type="checkbox" id="wd-media-recordings" />
              <label htmlFor="wd-media-recordings">Media Recordings</label>
            </div>
            <div>
              <input type="checkbox" id="wd-student-annotation" />
              <label htmlFor="wd-student-annotation">Student Annotation</label>
            </div>
            <div>
              <input type="checkbox" id="wd-file-upload" />
              <label htmlFor="wd-file-upload">File Uploads</label>
            </div>
          </td>
        </tr>

        <tr>
          <td align="right" valign="top">
            <label>Assign to</label>
          </td>
          <td>
            <select id="wd-assign-to">
              <option>Everyone</option>
              <option>TAs</option>
            </select>
          </td>
        </tr>

        <tr>
          <td align="right" valign="top">
            <label>Due</label>
          </td>
          <td>
            <input type="date" id="wd-due-date" />
          </td>
        </tr>
        <tr>
          <td align="right" valign="top">
            <label>Available from</label>
          </td>
          <td>
            <input type="date" id="wd-available-from" />
          </td>
        </tr>

        <tr>
          <td align="right" valign="top">
            <label>Until</label>
          </td>
          <td>
            <input type="date" id="wd-available-until" />
          </td>
        </tr>
        <tr>
          <td >
            <hr/>
            <button type="button" id="wd-assignment-cancel">Cancel</button>
            <button type="button" id="wd-assignment-save">Save</button>
          </td>
        </tr>


      </table>
    </div>
);}
  