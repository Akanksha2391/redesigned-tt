import React, { Component } from "react";
import moment from "moment";
import axios from "axios";
import AddEventModal from "./AddEventModal";
import WeekToolbar from "./WeekToolbar";
import WeakSlotGroup from "./WeekSlotGroup";
import { getAllDaysInTheWeek } from "../../utils";
import { container } from "../styles";
import uniqid from "uniqid";
import TimeHeader from "./TimeHeader";
import { times } from "../../utils";
import CalendarEventHandler from "../../calendarEventHandler";

class WeekView extends Component {
  state = {
    startDate: +moment(),
    weekDays: getAllDaysInTheWeek(),
    showAddEventModal: false,
    eventStart: null,
    eventEnd: null,
    course_code: "",
    eventId: null,
    editMode: false,
    clashes: null,
    subjectInfo: null,
    subjectClashes: null,
    final_events: null,
    isBooked: false,
    isTeacherClash: false,
    events: this.props.events,
    selectedEvent: null,
    showClashes: false,
    mytimetable: [],
  };

  /**
   * Sets next week days in the state
   */
  goToNextWeek = () => {
    const dateAfter7Days = moment(this.state.startDate).add(7, "days");
    this.setState({
      startDate: +dateAfter7Days,
      weekDays: getAllDaysInTheWeek(dateAfter7Days),
    });
  };

  /**
   * Sets previous week days in the state
   */
  goToPreviousWeek = () => {
    const dateBefore7Days = moment(this.state.startDate).subtract(7, "days");
    this.setState({
      startDate: +dateBefore7Days,
      weekDays: getAllDaysInTheWeek(dateBefore7Days),
    });
  };

  /**
   * Brings today's date in the view
   */
  goToToday = () => {
    this.setState({
      startDate: +moment(),
      weekDays: getAllDaysInTheWeek(),
    });
  };
  onheadingChange = (title) => {
    this.setState({
      ...this.state,
      course_code: title,
    });
  };
  /**
   * Opens the add event modal and initialize the date from the cell
   * @param {timeStamp} dateStamp - DateStamp of the cell the user clicked
   * @param {number} time - Time of the cell the user clicked
   */
  openAddEventModal = (dateStamp, eventx, starttime, endtime) => {
    const start = moment(dateStamp).set("hour", starttime);
    const end = moment(dateStamp).set("hour", endtime);
    console.log(start.valueOf());
    console.log(end.valueOf());
    // console.log(start,end);
    console.log(eventx);
    if (!this.state.subjectInfo) {
      return;
    }
    if (this.state.subjectInfo && eventx.length == 0) {
      this.setState({
        ...this.state,
        isBooked: false,
        isTeacherClash: false,
        showAddEventModal: true,
        eventStart: +start,
        eventEnd: +end,
        editMode: false,
        selectedEvent: eventx,
      });
    } else if (this.state.subjectInfo && eventx.length == 1) {
      if (eventx[0].course_code != this.state.subjectInfo.course_code) {
        let isTeacherClash = false;
        for (let i = 0; i < this.props.subjects.length; i++) {
          if (this.props.subjects[i].course_code == eventx[0].course_code) {
            isTeacherClash = true;
            break;
          }
        }
        this.setState({
          ...this.state,
          isBooked: true,
          isTeacherClash: isTeacherClash,
          showAddEventModal: true,
          eventStart: +start,
          eventEnd: +end,
          editMode: false,
          selectedEvent: eventx,
          eventId: CalendarEventHandler.generateId(eventx),
        });
      } else {
        this.setState({
          ...this.state,
          isTeacherClash: false,
          isBooked: false,
          showAddEventModal: true,
          eventStart: +start,
          eventEnd: +end,
          editMode: true,
          eventId: eventx[0].id,
          selectedEvent: eventx,
        });
      }
    } else {
      let flag = -1;
      for (let i = 0; i < eventx.length; i++) {
        for (let j = 0; j < this.props.subjects.length; j++) {
          console.log(
            eventx[i].course_code,
            this.props.subjects[j].course_code
          );
          if (eventx[i].course_code == this.props.subjects[j].course_code) {
            flag = i;
            break;
          }
        }
      }
      if (flag == -1) {
        this.setState({
          ...this.state,
          isTeacherClash: false,
          isBooked: true,
          showAddEventModal: true,
          eventStart: +start,
          eventEnd: +end,
          editMode: true,
          selectedEvent: eventx,
          eventId: CalendarEventHandler.generateId(eventx),
        });
      } else {
        this.setState({
          ...this.state,
          isTeacherClash: false,
          isBooked: false,
          showAddEventModal: true,
          eventStart: +start,
          eventEnd: +end,
          editMode: false,
          selectedEvent: eventx,
          course_code: eventx[flag].course_code,
          eventId: CalendarEventHandler.generateId(eventx),
        });
      }
    }
  };

  /**
   * Closes the add event modal
   */
  onCloseAddEventModal = (eventx) => {
    if (this.state.editMode) {
      this.props.onEventDelete(eventx);
      const detail = {
        subCode: this.state.subjectInfo.course_code,
        startTime: this.state.eventStart,
        endTime: this.state.eventEnd,
      };
      axios
        .post("http://localhost:5000/api/cancelledSlot", detail)
        .then((res) => {
          console.log(res);
        });
      console.log("deleting from onClose Add", eventx);
      this.props.onClassDelete(eventx.slice(0, 19), "empty");
      this.setState({
        ...this.state,
        course_code: "",
        eventId: null,
        eventStart: null,
        eventEnd: null,
      });
    }
    this.setState({
      showAddEventModal: false,
      editMode: false,
    });
  };
  onCloseTab = () => {
    this.setState({
      showAddEventModal: false,
      editMode: false,
      eventId: null,
      course_code: null,
      eventStart: null,
      eventEnd: null,
    });
  };
  /**
   * Adds the new event and closes the add event modal
   * @param {string} title - Title of the new event
   */
  onOkAddEventModal = (event) => {
    let final_events = this.state.final_events;
    let st = this.state.eventStart;
    let end = this.state.eventEnd;
    let flag = 1;

    let dx = Object.keys(final_events);
    for (let j = 0; j < dx.length; j++) {
      for (let i = 0; i < final_events[dx[j]].length; i++) {
        if (
          final_events[dx[j]][i].start >= end ||
          final_events[dx[j]][i].end <= st
        ) {
        } else if (
          final_events[dx[j]][i].course_code ==
          this.state.subjectInfo.course_code
        ) {
          continue;
        } else {
          flag = 0;
          console.log(final_events[dx[j]], st, end, flag);
        }
      }
    }
    console.log(flag);
    if (flag === 1) {
      console.log("flag is 1", this.state.eventId);
      if (this.state.eventId) {
        event.course_code = this.state.subjectInfo.course_code;
        event.course_name = this.state.subjectInfo.course_name;
        event.start = this.state.eventStart;
        event.end = this.state.eventEnd;
        this.props.onEventUpdate(this.state.eventId, event);
      } else {
        event.course_code = this.state.subjectInfo.course_code;
        event.course_name = this.state.subjectInfo.course_name;
        event.start = this.state.eventStart;
        event.end = this.state.eventEnd;
        event.eventId = CalendarEventHandler.generateId(event);
        console.log("flag is 1", event);
        this.props.onNewEvent(event);
      }
      this.setState({
        ...this.state,
        showAddEventModal: false,
        editMode: false,
        eventId: null,
        course_code: null,
        eventStart: null,
        eventEnd: null,
      });
    } else {
      this.setState({
        ...this.state,
        showAddEventModal: false,
        editMode: false,
        eventId: null,
        course_code: null,
        eventStart: null,
        eventEnd: null,
      });
    }
  };

  /**
   * Saves the timeStamps of the new event in the state
   * @param {arr: moment, moment} - Array containing start and end date of the new event
   */
  onCurrentEventTimeChange = (e) => {
    const dates = e.dates;
    this.setState({
      course_code: e.title,
      showAddEventModal: true,
      eventStart: +dates[0],
      eventEnd: +dates[1],
    });
  };
  setTitle = (event) => {
    if (event.id) {
      this.setState({
        ...this.state,
        editMode: true,
        showAddEventModal: true,
        course_code: event.title,
        eventId: event.id,
        eventStart: event.start,
        eventEnd: event.end,
      });
    }
  };
  getSubjectInfo = (subject) => {
    // just testing
    return axios
      .get("/api/status")
      .then((resp) => {
        console.log(resp.data);
        return resp.data;
      })
      .catch((err) => {
        console.log(err);
      });
  };
  changeTimeTable = (e) => {
    if (e.target.value === "none") {
      let temp_events = {};
      temp_events = this.props.events;
      this.setState({
        ...this.state,
        subjectInfo: null,
        subjectClashes: null,
        showAddEventModal: false,
        final_events: temp_events,
      });
    } else {
      // this.getSubjectInfo(e)
      //  .then((resp)=>{
      //   this.setState({...this.state,subjectInfo:resp});
      //  });

      let events = {};
      let final_events = {};
      if (this.state.events) {
        final_events = JSON.parse(JSON.stringify(this.state.events));
      }

      const subjects = this.props.subjects;
      let subject = {
        course_code: e.target.value,
        course_name: "",
      };
      for (let i = 0; i < subjects.length; i++) {
        if (subjects[i].course_code == e.target.value) {
          subject = subjects[i];
          break;
        }
      }
      const clashes = [
        {
          course_code: "ADV302",
          course_name: "Advance",
          clashed_count: 30,
          instructor_email: "gajulapallyabhilash@gmail.com",
          instructor_id: "AD105",
          start: "1667727000000",
          end: "1667730600000",
          prof: "Allu Arjun",
          isemailSent: false,
        },
        {
          course_code: "AI402",
          course_name: "AI",
          clashed_count: 3,
          instructor_email: "gajulapallyabhilash@gmail.com",
          instructor_id: "AI501",
          start: "1667737800000",
          end: "1667741400000",
          prof: "Prabhas",
          isemailSent: false,
        },
        {
          course_code: "MLO302",
          course_name: "Machine Learning",
          clashed_count: 3,
          instructor_email: "gajulapallyabhilash@gmail.com",
          instructor_id: "AD105",
          start: "1667986200000",
          end: "1667989800000",
          prof: "NTR",
          isemailSent: false,
        },
      ];
      if (clashes.length) {
        for (let i = 0; i < clashes.length; i++) {
          let x = String(moment(Number(clashes[i].start)).dayOfYear());
          let y = String(moment(Number(clashes[i].start)).year());
          if (clashes[i].course_code != subject.course_code)
            clashes[i].clashed = true;
          if (!final_events[y + x]) {
            final_events[y + x] = [];
          }
          final_events[y + x].push(clashes[i]);
        }
      }

      this.setState({
        ...this.state,
        final_events: final_events,
        subjectInfo: subject,
        showAddEventModal: false,
        clashes: clashes,
      });
    }
  };

  onchangeTimeTable = (e) => {
    if (e.target.value === "none") {
      let temp_events = {};
      temp_events = this.props.events;
      this.setState({
        ...this.state,
        subjectInfo: null,
        subjectClashes: null,
        showAddEventModal: false,
        final_events: temp_events,
        showClashes: false,
      });
    } else {
      let events = {};
      let final_events = {};
      if (this.state.events) {
        final_events = JSON.parse(JSON.stringify(this.state.events));
      }

      const subjects = this.props.subjects;
      let subject = {
        course_code: e.target.value,
        course_name: "",
      };
      for (let i = 0; i < subjects.length; i++) {
        if (subjects[i].course_code == e.target.value) {
          subject = subjects[i];
          break;
        }
      }
      // const clashes = [
      //   {
      //     course_code: "ADV302",
      //     course_name: "Advance",
      //     clashed_count: 30,
      //     instructor_email: "gajulapallyabhilash@gmail.com",
      //     instructor_id: "AD105",
      //     start: "1667727000000",
      //     end: "1667730600000",
      //     prof: "Allu Arjun",
      //     isemailSent: false,
      //   },
      //   {
      //     course_code: "AI402",
      //     course_name: "AI",
      //     clashed_count: 3,
      //     instructor_email: "gajulapallyabhilash@gmail.com",
      //     instructor_id: "AI501",
      //     start: "1667737800000",
      //     end: "1667741400000",
      //     prof: "Prabhas",
      //     isemailSent: false,
      //   },
      //   {
      //     course_code: "MLO302",
      //     course_name: "Machine Learning",
      //     clashed_count: 3,
      //     instructor_email: "gajulapallyabhilash@gmail.com",
      //     instructor_id: "AD105",
      //     start: "1667986200000",
      //     end: "1667989800000",
      //     prof: "NTR",
      //     isemailSent: false,
      //   },
      // ];
      // if (clashes.length) {
      //   for (let i = 0; i < clashes.length; i++) {
      //     let x = String(moment(Number(clashes[i].start)).dayOfYear());
      //     let y = String(moment(Number(clashes[i].start)).year());
      //     if (clashes[i].course_code != subject.course_code)
      //       clashes[i].clashed = true;
      //     if (!final_events[y + x]) {
      //       final_events[y + x] = [];
      //     }
      //     final_events[y + x].push(clashes[i]);
      //   }
      // }
      if (!this.props.clashes[e.target.value]) {
        console.log("fetching server");
      }

      this.setState({
        ...this.state,
        final_events: final_events,
        subjectInfo: subject,
        showAddEventModal: false,
        // clashes: clashes,
        showClashes: true,
      });
    }
  };

  componentDidMount() {
    // this.setState((prev) => ({
    //   ...prev,
    //   mytimetable: +mytimetable,
    // }));

    this.setState({
      ...this.state,
      final_events: this.props.events,
    });
  }

  render() {
    const { weekDays, showAddEventModal, eventStart, eventEnd, startDate } =
      this.state;
    const { subjects, events, clashes, setClashes } = this.props;

    return (
      <div
        style={{
          ...container,
          paddingTop: "0px",
        }}
      >
        <div style={{ display: "flex", paddingLeft: "40%" }}>
          <h3
            style={{
              fontFamily: "Ubuntu",
              fontSize: "30px",
              textAlign: "center",
            }}
          >
            Monsoon Semester Time Table
          </h3>
          <select
            className="form-select"
            style={{
              fontSize: "20px",
              height: "40px",
              width: "150px",
              display: "grid",
              marginLeft: "auto",
              fontFamily: "Ubuntu",
              marginBottom: "2rem",
              marginTop: "0rem",
            }}
            onChange={(e) => {
              this.onchangeTimeTable(e);
            }}
          >
            <option value="none"> Subject </option>{" "}
            {subjects &&
              subjects.map((sub) => {
                return (
                  <option key={sub.course_code} value={sub.course_code}>
                    {sub.course_name}
                  </option>
                );
              })}
          </select>
        </div>
        <div style={{}}>
          <AddEventModal
            key={uniqid()}
            onheadingChange={this.onheadingChange}
            editMode={this.state.editMode}
            course_code={this.state.course_code}
            visible={this.state.subjectInfo && showAddEventModal}
            onCancel={this.onCloseAddEventModal}
            onCloseTab={this.onCloseTab}
            onClose={this.onCloseAddEventModal}
            onOk={this.onOkAddEventModal}
            eventStart={this.state.eventStart}
            eventEnd={this.state.eventEnd}
            eventId={this.state.eventId}
            isSubjectClash={this.state.isBooked}
            onTimeChange={this.onCurrentEventTimeChange}
            clashes={this.state.clashes}
            onEventDelete={this.props.onEventDelete}
            onClassDelete={this.props.onClassDelete}
            onEventUpdate={this.props.onEventUpdate}
            subjects={subjects}
            present_subject={this.state.subjectInfo}
            isTeacherClash={this.state.isTeacherClash}
          />
          <WeekToolbar
            goToPreviousWeek={this.goToPreviousWeek}
            goToNextWeek={this.goToNextWeek}
            startDate={startDate}
            goToToday={this.goToToday}
          />{" "}
          <div key={uniqid()}>
            <TimeHeader times={times} />{" "}
            {this.props.mytimetable
              ? weekDays.map((day) => {
                  const x1 = moment(day.dateStamp).year();
                  const y = moment(day.dateStamp).dayOfYear();
                  const z = String(x1) + String(y);
                  let mytime = [];

                  // add extra class to mytime
                  for (let ec = 0; ec < this.props.extraclass; ec++) {
                    let classdetails = this.props.extraclass[ec];
                    if (
                      day.dateStamp === classdetails.start &&
                      !(
                        classdetails.id.slice(0, 19) in
                        this.props.cancelledclass
                      )
                    ) {
                      mytime.push(classdetails);
                    }
                  }

                  const generalttbyDay =
                    this.props.mytimetable[day.weekDayName];

                  for (let i = 0; i < generalttbyDay.length; i++) {
                    let data = generalttbyDay[i];
                    let date = moment(day.dateStamp).format("YYYY-MM-DD");

                    let start = new Date(date + " " + data.time.split("-")[0]);
                    if (start.getHours() < 8) {
                      start = start.setHours(start.getHours() + 12);
                    } else {
                      start = start.getTime();
                    }

                    data.start = start;
                    data.end = start + 50 * 60 * 1000;
                    data.eventId = data.start + data.course_code + data.end;
                    data.id = data.eventId;
                    data.startWeek = moment(start).week();
                    data.endWeek = moment(start).week();
                    if (
                      !(
                        String(start) + data.course_code in
                        this.props.cancelledclass
                      )
                    ) {
                      mytime.push(data);
                    } else {
                      console.log("class was cancelled", data);
                    }
                  }

                  console.log(mytime, "mutime", day.date);

                  return (
                    <WeakSlotGroup
                      key={uniqid()}
                      day={day}
                      weekDays={weekDays}
                      time={times}
                      setTitle={this.setTitle}
                      mytimetable={mytime}
                      events={this.props.events ? this.props.events[z] : []}
                      extraclass={this.props.extraclass}
                      cancelledSlots={{ abcd: 1 }}
                      clashes={
                        this.state.showClashes &&
                        clashes[this.state.subjectInfo.course_code] &&
                        clashes[this.state.subjectInfo.course_code][z]
                          ? clashes[this.state.subjectInfo.course_code][z]
                          : []
                      }
                      // events={
                      //   this.state.events ? this.state.final_events[z] : []
                      // }
                      dateStamp={z}
                      openAddEventModal={this.openAddEventModal}
                      onEventDelete={this.props.onEventDelete}
                      onClassDelete={this.props.onClassDelete}
                      onEventUpdate={this.props.onEventUpdate}
                      subjects={this.props.subjects}
                    />
                  );
                })
              : null}{" "}
          </div>{" "}
        </div>{" "}
      </div>
    );
  }
}

export default WeekView;
