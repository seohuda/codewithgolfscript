import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침",
};

export default function PrivacyPage() {
  return (
    <article className="prose prose-sm mx-auto max-w-3xl text-ink">
      <h1 className="text-2xl font-bold">개인정보처리방침</h1>
      <p className="text-ink-soft">시행일: 2026년 6월 13일</p>

      <p>
        CODE WITH GOLFSCRIPT(이하 &ldquo;서비스&rdquo;)는 개인정보보호법에 따라
        이용자의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게
        처리하기 위해 다음과 같이 개인정보처리방침을 수립·공개합니다.
      </p>

      <h2 className="mt-8 text-lg font-semibold">1. 수집하는 개인정보 항목</h2>
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left">항목</th>
            <th className="text-left">수집 목적</th>
            <th className="text-left">보유 기간</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>아이디(username)</td>
            <td>서비스 이용 식별</td>
            <td>탈퇴 시까지</td>
          </tr>
          <tr>
            <td>이메일</td>
            <td>본인 확인, 비밀번호 재설정</td>
            <td>탈퇴 시까지</td>
          </tr>
          <tr>
            <td>비밀번호(암호화 저장)</td>
            <td>본인 인증</td>
            <td>탈퇴 시까지</td>
          </tr>
          <tr>
            <td>IP 주소</td>
            <td>부정가입 방지</td>
            <td>탈퇴 시까지</td>
          </tr>
        </tbody>
      </table>

      <h2 className="mt-8 text-lg font-semibold">2. 개인정보의 처리 목적</h2>
      <ul>
        <li>회원 가입 및 본인 확인</li>
        <li>서비스 제공 및 운영(코드 제출, 게시판 이용 등)</li>
        <li>부정 이용 방지 및 계정 보안</li>
        <li>서비스 관련 안내(이메일)</li>
      </ul>

      <h2 className="mt-8 text-lg font-semibold">3. 개인정보의 제3자 제공</h2>
      <p>
        서비스는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만,
        다음의 경우에는 예외로 합니다.
      </p>
      <ul>
        <li>이용자가 사전에 동의한 경우</li>
        <li>법령에 따라 제공이 요구되는 경우</li>
      </ul>
      <p>
        인증 메일 발송을 위해 이메일 주소가 이메일 발송 서비스(Resend)에
        전달됩니다.
      </p>

      <h2 className="mt-8 text-lg font-semibold">4. 개인정보의 보유 및 파기</h2>
      <ul>
        <li>회원 탈퇴 시 개인정보는 지체 없이 파기합니다.</li>
        <li>
          탈퇴를 신청한 후 7일간 로그인하지 않으면 자동으로 계정이 삭제됩니다.
        </li>
        <li>
          이메일 미인증 계정은 가입 후 24시간 경과 시 자동 삭제됩니다.
        </li>
      </ul>

      <h2 className="mt-8 text-lg font-semibold">5. 쿠키의 사용</h2>
      <p>
        서비스는 로그인 세션 유지를 위해 필수 쿠키(gs_session)를 사용합니다.
        해당 쿠키는 서비스 이용에 필수적이며, 광고·분석 등 목적의 쿠키는
        사용하지 않습니다.
      </p>

      <h2 className="mt-8 text-lg font-semibold">6. 이용자의 권리</h2>
      <ul>
        <li>개인정보 열람·정정·삭제 요청</li>
        <li>회원 탈퇴(계정 삭제) 요청</li>
        <li>
          위 권리는 서비스 내 설정 페이지 또는 관리자 이메일을 통해 행사할 수
          있습니다.
        </li>
      </ul>

      <h2 className="mt-8 text-lg font-semibold">7. 개인정보 보호 조치</h2>
      <ul>
        <li>비밀번호는 scrypt 알고리즘으로 단방향 암호화하여 저장합니다.</li>
        <li>세션 토큰은 HMAC-SHA256 서명으로 위변조를 방지합니다.</li>
        <li>HTTPS를 통한 데이터 전송 암호화를 적용합니다.</li>
      </ul>

      <h2 className="mt-8 text-lg font-semibold">8. 만 14세 미만 아동</h2>
      <p>
        서비스는 만 14세 미만 아동의 회원가입을 제한합니다. 만 14세 미만임이
        확인될 경우 해당 계정은 삭제될 수 있습니다.
      </p>

      <h2 className="mt-8 text-lg font-semibold">9. 개인정보 보호책임자</h2>
      <p>
        개인정보 보호 관련 문의는 아래로 연락해 주세요.
      </p>
      <ul>
        <li>이메일: privacy@golfscript.xyz</li>
      </ul>

      <h2 className="mt-8 text-lg font-semibold">10. 방침 변경</h2>
      <p>
        본 방침이 변경되는 경우 시행 7일 전 서비스 내 공지를 통해 알려드립니다.
      </p>
    </article>
  );
}
