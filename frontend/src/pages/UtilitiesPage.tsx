import { Target, ClipboardList, Sparkles, Footprints, Timer, Flame, Activity } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { getLocalDateString, addDaysToDateString, formatFriendlyDate, isTodayLocal } from '../utils/dateHelper';

export default function UtilitiesPage() {
  // --- AI ASSISTANT STATE ---
  const todayStr = getLocalDateString();
  const [selectedDate, setSelectedDate] = useState<any><Activity className="w-4 h-4 inline mr-2" /> Gasto Metabólico Total</div>
                  <div className="kpi-value success">
                    {calc2Result > 0 ? calc2Result.toFixed(2) : '0.00'} <span style={{ fontSize: '1.25rem' }}>kcal</span>
                  </div>
                  {vo2Result > 0 && (
                    <div className="kpi-detail">VO₂ Consumido: {vo2Result.toFixed(2)} ml/kg/min</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>



    </div>
  );
}




