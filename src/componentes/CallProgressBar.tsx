"use client";
import { useState, useEffect } from "react";
import { Progress, Button } from "antd";
import { PlusOutlined, MinusOutlined } from "@ant-design/icons";
import "./CallProgressBar.css";

const CallProgressBar = ({
  answered = 0,
  unanswered = 0,
  onUpdate,
}: {
  answered: number;
  unanswered: number;
  onUpdate?: (answered: number, unanswered: number) => void;
}) => {
  const [answeredCalls, setAnsweredCalls] = useState(answered);
  const [unansweredCalls, setUnansweredCalls] = useState(unanswered);

  useEffect(() => {
    setAnsweredCalls(answered);
    setUnansweredCalls(unanswered);
  }, [answered, unanswered]);

  const totalCalls = answeredCalls + unansweredCalls;
  const answeredPercentage =
    totalCalls > 0 ? (answeredCalls / totalCalls) * 100 : 0;
  const unansweredPercentage =
    totalCalls > 0 ? (unansweredCalls / totalCalls) * 100 : 0;

  const handleChange = (newAnswered: number, newUnanswered: number) => {
    setAnsweredCalls(newAnswered);
    setUnansweredCalls(newUnanswered);
    onUpdate?.(newAnswered, newUnanswered);
  };

  return (
    <div className="call-progress-container">
      <div className="progress-wrapper">
        <Progress
          type="circle"
          percent={answeredPercentage + unansweredPercentage}
          success={{ percent: answeredPercentage, strokeColor: "#1677ff" }}
          strokeColor="#ff4d4f"
          strokeWidth={8}
          width={200}
          format={() => (
            <div className="progress-content">
              <div className="progress-label">Total de</div>
              <div className="progress-label">llamadas</div>
              <div className="progress-value">{totalCalls}</div>
            </div>
          )}
        />
      </div>

      <div className="controls-container">
        <div className="control-row">
          <div className="legend-item">
            <span className="legend-color answered"></span>
            <span className="legend-text">Llamadas contestadas</span>
            <span className="legend-value">{answeredCalls}</span>
          </div>
          <div className="button-group">
            <Button
              icon={<PlusOutlined />}
              onClick={() =>
                handleChange(answeredCalls + 1, unansweredCalls)
              }
              className="control-button"
            />
            <Button
              icon={<MinusOutlined />}
              onClick={() =>
                handleChange(Math.max(0, answeredCalls - 1), unansweredCalls)
              }
              className="control-button"
              disabled={answeredCalls === 0}
            />
          </div>
        </div>

        <div className="control-row">
          <div className="legend-item">
            <span className="legend-color unanswered"></span>
            <span className="legend-text">Llamadas no contestadas</span>
            <span className="legend-value">{unansweredCalls}</span>
          </div>
          <div className="button-group">
            <Button
              icon={<PlusOutlined />}
              onClick={() =>
                handleChange(answeredCalls, unansweredCalls + 1)
              }
              className="control-button"
            />
            <Button
              icon={<MinusOutlined />}
              onClick={() =>
                handleChange(answeredCalls, Math.max(0, unansweredCalls - 1))
              }
              className="control-button"
              disabled={unansweredCalls === 0}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallProgressBar;
